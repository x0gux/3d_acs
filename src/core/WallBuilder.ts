import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { WallOptions, WorldPoint } from "./types";

/**
 * 바닥면 외곽선 점들을 받아 외곽을 따라 세워지는 3D 벽을 생성합니다.
 *
 * 생성 방식: 각 변(edge)마다 BoxGeometry(두께 × 높이 × 변길이)를 만들고
 * 변 방향으로 회전·배치한 뒤 단일 지오메트리로 병합한다.
 * → 높이(heightM)와 두께(thicknessM)가 독립적으로 반영됨.
 * (변 길이에 두께를 더해 모서리가 맞물리도록 함)
 */
export class WallBuilder {
  private scene: THREE.Scene;
  private walls = new Map<string, THREE.Mesh>();
  private counter = 0;
  private selectedId: string | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * 월드 포인트 배열 → 3D 벽 메시 생성
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

    const geoms: THREE.BufferGeometry[] = [];
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
      geoms.push(geo);
    }

    if (geoms.length === 0) {
      throw new Error("유효한 벽 변이 없습니다.");
    }

    const merged = mergeGeometries(geoms);
    geoms.forEach((g) => g.dispose());
    if (!merged) {
      throw new Error("벽 지오메트리 병합에 실패했습니다.");
    }

    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(merged, material);
    mesh.userData.wallId = `wall_${++this.counter}`;

    this.scene.add(mesh);
    const wallId = mesh.userData.wallId as string;
    this.walls.set(wallId, mesh);
    return wallId;
  }

  getWall(wallId: string): THREE.Mesh | undefined {
    return this.walls.get(wallId);
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

  /** 벽 선택 (선택된 벽은 emissive로 하이라이트) */
  setSelected(wallId: string | null) {
    if (this.selectedId) {
      const prev = this.walls.get(this.selectedId);
      if (prev) {
        (prev.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
      }
    }
    this.selectedId = wallId;
    if (wallId) {
      const mesh = this.walls.get(wallId);
      if (mesh) {
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x1d4ed8);
      }
    }
  }

  getSelected(): string | null {
    return this.selectedId;
  }

  /** 레이캐스트로 가장 가까운 벽 피킹 */
  raycastWalls(
    raycaster: THREE.Raycaster
  ): { wallId: string; mesh: THREE.Mesh } | null {
    let closest: { wallId: string; mesh: THREE.Mesh; dist: number } | null = null;
    for (const [id, mesh] of this.walls) {
      const hits = raycaster.intersectObject(mesh);
      if (hits.length > 0) {
        if (!closest || hits[0].distance < closest.dist) {
          closest = { wallId: id, mesh, dist: hits[0].distance };
        }
      }
    }
    return closest ? { wallId: closest.wallId, mesh: closest.mesh } : null;
  }

  // ───────────────────────────────────────────────────────
  // 삭제
  // ───────────────────────────────────────────────────────

  removeWall(wallId: string): void {
    const mesh = this.walls.get(wallId);
    if (!mesh) return;

    if (this.selectedId === wallId) this.selectedId = null;

    this.scene.remove(mesh);
    mesh.geometry.dispose();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m) => m.dispose());
    } else {
      mesh.material.dispose();
    }
    this.walls.delete(wallId);
  }

  clearAll(): void {
    const ids = Array.from(this.walls.keys());
    for (const id of ids) {
      this.removeWall(id);
    }
    this.selectedId = null;
  }
}
