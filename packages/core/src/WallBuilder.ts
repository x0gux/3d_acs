import * as THREE from "three";
import type { WallOptions, WorldPoint, WallFadeOptions } from "./types";
import type { PgmWallBox } from "./MapFormats";

const DEFAULT_FADE: WallFadeOptions = {
  enabled: true,
  minOpacity: 0.15,
  fadeStart: 0.45,
  fadeEnd: 0.85,
  fadeSpeed: 8,
};

/** 벽 한 변(세그먼트) — 페이드 판정에 필요한 정보를 함께 보관 */
interface WallSegment {
  mesh: THREE.Mesh;
  /** 변 중점 (월드 좌표, y = 높이/2) */
  midpoint: THREE.Vector3;
  /** 루프 바깥쪽을 향하는 수평 단위 법선 */
  outward: THREE.Vector3;
  /** 프레임 보간된 현재 opacity */
  opacity: number;
  /**
   * true면 벽면 양쪽 모두에서 바라볼 때 페이드 (|dot| 판정).
   * PGM 자동 벽 같은 스탠드얼론 박스에 사용. 수동 루프 벽은 false(안/밖 구분).
   */
  bothSides?: boolean;
}

interface WallEntry {
  group: THREE.Group;
  segments: WallSegment[];
}

/**
 * 바닥면 외곽선 점들을 받아 외곽을 따라 세워지는 3D 벽을 생성합니다.
 *
 * 생성 방식: 각 변(edge)마다 BoxGeometry(두께 × 높이 × 변길이)를 만들고
 * 변 방향으로 회전·배치한다. → 높이(heightM)와 두께(thicknessM)가 독립적으로 반영됨.
 * (변 길이에 두께를 더해 모서리가 맞물리도록 함)
 *
 * 뷰 의존적 페이드: 변 단위로 메시를 분리해 두어, 카메라에 가려지는 쪽
 * (카메라가 벽 바깥쪽에 있고 시선 각도가 낮은) 벽만 자동으로 반투명해집니다.
 * → 내부 로봇/경로가 벽에 가려지지 않고, 위에서 볼 때는 불투명하게 유지됩니다.
 *   updateViewDependentOpacity()를 프레임마다 호출해야 동작합니다.
 */
export class WallBuilder {
  private scene: THREE.Scene;
  private walls = new Map<string, WallEntry>();
  private counter = 0;
  private selectedId: string | null = null;
  private fade: WallFadeOptions;

  private _v = new THREE.Vector3();

  constructor(scene: THREE.Scene, fadeOptions?: Partial<WallFadeOptions>) {
    this.scene = scene;
    this.fade = { ...DEFAULT_FADE, ...fadeOptions };
  }

  /**
   * 월드 포인트 배열 → 3D 벽 메시 생성 (변 단위 메시들의 Group)
   * points: 루프가 닫힌 순서의 바닥면 점들 (미터)
   */
  buildWall(
    points: WorldPoint[],
    opts: WallOptions = { heightM: 3, thicknessM: 0.15 },
    color: number = 0x94a3b8
  ): string {
    if (points.length < 3) {
      throw new Error("벽 생성을 위해서는 최소 3개 이상의 점이 필요합니다.");
    }

    // 루프 회전 방향 판정 (shoelace, x-z 평면)
    // > 0: 반시계(CCW) → 내부는 진행 방향 왼쪽 / < 0: 시계(CW) → 오른쪽
    let area2 = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      area2 += a.x * b.z - b.x * a.z;
    }
    const ccw = area2 > 0;

    const group = new THREE.Group();
    const segments: WallSegment[] = [];

    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length]; // 루프: 마지막 → 첫 점 연결
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz);
      if (len < 1e-4) continue;

      // BoxGeometry(폭=두께, 높이, 깊이=변길이+두께) → Y축 회전으로 변 방향 정렬
      const geo = new THREE.BoxGeometry(
        opts.thicknessM,
        opts.heightM,
        len + opts.thicknessM
      );
      geo.rotateY(Math.atan2(dx, dz));
      // 변의 중점에 배치, 바닥(y=0)부터 세워지도록 y = 높이/2
      geo.translate((a.x + b.x) / 2, opts.heightM / 2, (a.z + b.z) / 2);

      // 각도별 페이드를 위해 투명 렌더링 활성화 (opacity는 프레임마다 갱신)
      const material = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
      });
      const mesh = new THREE.Mesh(geo, material);

      // 내부 법선(수평 단위 벡터) → 바깥쪽 법선으로 저장
      let nx: number, nz: number;
      if (ccw) {
        nx = -dz / len;
        nz = dx / len;
      } else {
        nx = dz / len;
        nz = -dx / len;
      }

      segments.push({
        mesh,
        midpoint: new THREE.Vector3(
          (a.x + b.x) / 2,
          opts.heightM / 2,
          (a.z + b.z) / 2
        ),
        outward: new THREE.Vector3(-nx, 0, -nz),
        opacity: 1,
      });
      group.add(mesh);
    }

    if (segments.length === 0) {
      this.disposeGroup(group);
      throw new Error("유효한 벽 변이 없습니다.");
    }

    this.scene.add(group);
    const wallId = `wall_${++this.counter}`;
    group.userData.wallId = wallId;
    this.walls.set(wallId, { group, segments });
    return wallId;
  }

  // ───────────────────────────────────────────────────────
  // 뷰 의존적 페이드 (카메라에 가려지는 앞벽 자동 반투명)
  // ───────────────────────────────────────────────────────

  /**
   * 프레임마다 호출. 카메라 위치와 각 세그먼트의 바깥 법선 코사인(s)으로
   * 목표 opacity를 정하고, fadeSpeed 기반 지수 보간으로 부드럽게 전환한다.
   */
  updateViewDependentOpacity(camera: THREE.Camera, dt: number): void {
    if (!this.fade.enabled || this.walls.size === 0) return;

    const { minOpacity, fadeStart, fadeEnd, fadeSpeed } = this.fade;
    const range = Math.max(fadeEnd - fadeStart, 1e-3);
    const smooth = 1 - Math.exp(-fadeSpeed * Math.min(dt, 0.1));
    const camPos = camera.position;

    for (const entry of this.walls.values()) {
      for (const seg of entry.segments) {
        this._v.subVectors(camPos, seg.midpoint);
        const len = this._v.length();
        if (len < 1e-6) continue;
        this._v.multiplyScalar(1 / len);

        // 1=벽 정면 수평 방향, 0=수직(탑뷰), 음수=벽 안쪽에서 바라봄
        // bothSides 세그먼트(스탠드얼론 박스)는 양쪽에서 바라볼 때 모두 페이드
        const raw = this._v.dot(seg.outward);
        const s = seg.bothSides ? Math.abs(raw) : raw;
        const t = Math.min(Math.max((s - fadeStart) / range, 0), 1);
        const k = t * t * (3 - 2 * t); // smoothstep
        const target = 1 - k * (1 - minOpacity);

        seg.opacity += (target - seg.opacity) * smooth;
        (seg.mesh.material as THREE.MeshStandardMaterial).opacity = seg.opacity;
      }
    }
  }

  setFadeEnabled(enabled: boolean): void {
    this.fade.enabled = enabled;
    if (!enabled) this.resetOpacities();
  }

  isFadeEnabled(): boolean {
    return this.fade.enabled;
  }

  setFadeOptions(opts: Partial<WallFadeOptions>): void {
    const wasEnabled = this.fade.enabled;
    this.fade = { ...this.fade, ...opts };
    if (wasEnabled && !this.fade.enabled) this.resetOpacities();
  }

  getFadeOptions(): Readonly<WallFadeOptions> {
    return this.fade;
  }

  /** 페이드 비활성화 시 모든 세그먼트를 불투명으로 복원 */
  private resetOpacities(): void {
    for (const entry of this.walls.values()) {
      for (const seg of entry.segments) {
        seg.opacity = 1;
        (seg.mesh.material as THREE.MeshStandardMaterial).opacity = 1;
      }
    }
  }

  // ───────────────────────────────────────────────────────
  // 조회
  // ───────────────────────────────────────────────────────

  getWall(wallId: string): THREE.Object3D | undefined {
    return this.walls.get(wallId)?.group;
  }

  getWallCount(): number {
    return this.walls.size;
  }

  getWallIds(): string[] {
    return Array.from(this.walls.keys());
  }

  // ───────────────────────────────────────────────────────
  // 선택 / 하이라이트
  // ───────────────────────────────────────────────────────

  /** 벽 선택 (선택된 벽의 모든 세그먼트를 emissive로 하이라이트) */
  setSelected(wallId: string | null) {
    if (this.selectedId) {
      const prev = this.walls.get(this.selectedId);
      if (prev) this.setEmissive(prev, 0x000000);
    }
    this.selectedId = wallId;
    if (wallId) {
      const entry = this.walls.get(wallId);
      if (entry) this.setEmissive(entry, 0x1d4ed8);
    }
  }

  private setEmissive(entry: WallEntry, hex: number) {
    for (const seg of entry.segments) {
      (seg.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(hex);
    }
  }

  getSelected(): string | null {
    return this.selectedId;
  }

  // ───────────────────────────────────────────────────────
  // PGM 자동 벽 (뷰 의존적 페이드에 동일하게 참여)
  // ───────────────────────────────────────────────────────

  private autoWallId: string | null = null;

  /**
   * PGM에서 추출한 벽 박스들로 자동 벽을 생성합니다 (기존 자동 벽은 교체).
   * 수동 벽과 동일한 WallSegment 구조로 만들어 뷰 의존적 페이드가 동일하게 적용됩니다.
   * 스탠드얼론 박스는 안/밖 구분이 없으므로 양면 페이드(bothSides)로 동작합니다.
   * @returns 생성된 세그먼트 수
   */
  buildAutoWalls(
    boxes: PgmWallBox[],
    opts: { heightM?: number; color?: number } = {}
  ): number {
    this.clearAutoWalls();
    if (boxes.length === 0) return 0;

    const heightM = opts.heightM ?? 2.5;
    const color = opts.color ?? 0x475569;

    const group = new THREE.Group();
    const segments: WallSegment[] = [];

    for (const b of boxes) {
      const geo = new THREE.BoxGeometry(b.widthM, heightM, b.depthM);
      geo.translate(b.x, heightM / 2, b.z);
      const material = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
      });
      const mesh = new THREE.Mesh(geo, material);

      // 얇은 축이 벽면 법선 방향 (가로 런 → z축 법선, 세로 런 → x축 법선)
      const outward =
        b.widthM >= b.depthM
          ? new THREE.Vector3(0, 0, 1)
          : new THREE.Vector3(1, 0, 0);

      segments.push({
        mesh,
        midpoint: new THREE.Vector3(b.x, heightM / 2, b.z),
        outward,
        opacity: 1,
        bothSides: true,
      });
      group.add(mesh);
    }

    this.scene.add(group);
    const wallId = `auto_wall_${++this.counter}`;
    group.userData.wallId = wallId;
    this.walls.set(wallId, { group, segments });
    this.autoWallId = wallId;
    return segments.length;
  }

  /** PGM 자동 벽 제거 */
  clearAutoWalls(): void {
    if (!this.autoWallId) return;
    this.removeWall(this.autoWallId);
    this.autoWallId = null;
  }

  hasAutoWalls(): boolean {
    return this.autoWallId !== null;
  }

  /** 레이캐스트로 가장 가까운 벽 피킹 */
  raycastWalls(
    raycaster: THREE.Raycaster
  ): { wallId: string; mesh: THREE.Mesh } | null {
    let closest: { wallId: string; mesh: THREE.Mesh; dist: number } | null = null;
    for (const [id, entry] of this.walls) {
      const hits = raycaster.intersectObject(entry.group, true);
      if (hits.length > 0) {
        if (!closest || hits[0].distance < closest.dist) {
          closest = {
            wallId: id,
            mesh: hits[0].object as THREE.Mesh,
            dist: hits[0].distance,
          };
        }
      }
    }
    return closest ? { wallId: closest.wallId, mesh: closest.mesh } : null;
  }

  // ───────────────────────────────────────────────────────
  // 삭제
  // ───────────────────────────────────────────────────────

  removeWall(wallId: string): void {
    const entry = this.walls.get(wallId);
    if (!entry) return;

    if (this.selectedId === wallId) this.selectedId = null;

    this.scene.remove(entry.group);
    this.disposeGroup(entry.group);
    this.walls.delete(wallId);
  }

  private disposeGroup(group: THREE.Group): void {
    for (const child of group.children) {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else {
        mat?.dispose();
      }
    }
    group.clear();
  }

  clearAll(): void {
    const ids = Array.from(this.walls.keys());
    for (const id of ids) {
      this.removeWall(id);
    }
    this.selectedId = null;
    this.autoWallId = null;
  }
}
