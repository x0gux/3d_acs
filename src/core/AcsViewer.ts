import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type {
  AcsViewerOptions,
  MapCalibration,
  WallOptions,
  RobotPose,
  WorldPoint,
} from "./types";
import { WallBuilder } from "./WallBuilder";
import { RobotManager } from "./RobotManager";

/**
 * ACS 관제 3D 뷰어 코어 (순수 TypeScript + Three.js)
 * - 어떤 UI 프레임워크에도 의존하지 않음 (HTMLElement만 받음)
 * - 이동/회전/줌: OrbitControls
 * - 벽 그리기: Raycaster로 바닥면(Y=0) 클릭 → 월드 좌표
 * - 로봇: RobotManager(InstancedMesh) + Lerp 보간
 * - 클릭 피킹: 그리기 모드=점 추가 / 아니면 로봇 → 벽 순서로 선택
 */
export class AcsViewer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private wallBuilder: WallBuilder;
  private robotManager: RobotManager;
  private raycaster = new THREE.Raycaster();
  private clock = new THREE.Clock();

  private calibration: MapCalibration | null = null;
  private mapPlane: THREE.Mesh | null = null;

  // 벽 그리기 상태
  private wallDrawing = false;
  private wallMarkers = new THREE.Group();
  private markerGeo = new THREE.SphereGeometry(0.15, 12, 12);
  private markerMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
  private previewPositions = new Float32Array(512 * 3);
  private previewGeo = new THREE.BufferGeometry();
  private previewLine: THREE.Line;

  private onWallCreatedCb?: (wallId: string, mesh: THREE.Mesh) => void;
  private onWallPointAddedCb?: (point: WorldPoint) => void;
  private onWallSelectedCb?: (wallId: string | null) => void;
  private onRobotClickCb?: (robotId: string) => void;

  // 클릭 vs 드래그 구분용
  private downX = 0;
  private downY = 0;

  private handlePointerDown = (e: PointerEvent) => {
    this.downX = e.clientX;
    this.downY = e.clientY;
  };

  private handlePointerUp = (e: PointerEvent) => {
    // 드래그(회전/평이)였으면 무시
    if (Math.hypot(e.clientX - this.downX, e.clientY - this.downY) > 5) return;

    // 그리기 모드: 바닥 클릭 = 벽 점 추가
    if (this.wallDrawing) {
      const hit = this.raycastFloor(e.clientX, e.clientY);
      if (hit) this.addWallPointWorld(hit.x, hit.z);
      return;
    }

    // 일반 모드: 로봇 → 벽 순서로 피킹
    if (!this.setRaycasterFromScreen(e.clientX, e.clientY)) return;

    const robotHits = this.raycaster.intersectObject(this.robotManager.getMesh());
    const instanceId = robotHits[0]?.instanceId;
    if (instanceId !== undefined) {
      const robotId = this.robotManager.getRobotIdByInstance(instanceId);
      if (robotId) {
        this.onRobotClickCb?.(robotId);
        return;
      }
    }

    const wallHit = this.wallBuilder.raycastWalls(this.raycaster);
    if (wallHit) {
      this.wallBuilder.setSelected(wallHit.wallId);
      this.onWallSelectedCb?.(wallHit.wallId);
    } else {
      this.wallBuilder.setSelected(null);
      this.onWallSelectedCb?.(null);
    }
  };

  private animate = () => {
    requestAnimationFrame(() => this.animate());
    const dt = this.clock.getDelta();
    this.robotManager.update(dt); // 로봇 위치 보간
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  constructor(container: HTMLElement, options: AcsViewerOptions = {}) {
    this.container = container;

    const width = options.width ?? (container.clientWidth || 800);
    const height = options.height ?? (container.clientHeight || 600);

    // 씬
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(options.backgroundColor ?? 0x0b1120);
    this.scene.fog = new THREE.Fog(
      0x0b1120,
      options.fogNear ?? 80,
      options.fogFar ?? 300
    );

    // 카메라
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 500);
    this.camera.position.set(30, 28, 30);

    // 렌더러
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // 컨트롤 (이동/회전/줌 전부 OrbitControls 담당)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0, 0);

    // 관제 배경 프리셋 (바닥 그리드 + 평면 + 조명)
    const grid = new THREE.GridHelper(100, 50, 0x334155, 0x111827);
    this.scene.add(grid);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    this.scene.add(floor);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(30, 40, 20);
    this.scene.add(dirLight);

    // 벽 점 마커 + 프리뷰 라인
    this.scene.add(this.wallMarkers);
    this.previewGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(this.previewPositions, 3)
    );
    this.previewGeo.setDrawRange(0, 0);
    this.previewLine = new THREE.Line(
      this.previewGeo,
      new THREE.LineBasicMaterial({ color: 0x22d3ee })
    );
    this.scene.add(this.previewLine);

    // 매니저
    this.wallBuilder = new WallBuilder(this.scene);
    this.robotManager = new RobotManager(this.scene);

    // 클릭 핸들러
    this.renderer.domElement.addEventListener("pointerdown", this.handlePointerDown);
    this.renderer.domElement.addEventListener("pointerup", this.handlePointerUp);

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);

    this.animate();
  }

  private handleResize() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /** 화면 좌표로 레이캐스터 설정 */
  private setRaycasterFromScreen(clientX: number, clientY: number): boolean {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    return true;
  }

  /** 화면 클릭 좌표 → 바닥면(Y=0) 교차점 (월드 좌표) */
  private raycastFloor(clientX: number, clientY: number): WorldPoint | null {
    if (!this.setRaycasterFromScreen(clientX, clientY)) return null;
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(floorPlane, hit)) return null;
    return { x: hit.x, z: hit.z };
  }

  // ───────────────────────────────────────────────────────
  // 맵 이미지
  // ───────────────────────────────────────────────────────

  /** 맵 이미지 캘리브레이션 (바닥 텍스처 평면 크기 결정) */
  setMapCalibration(cal: MapCalibration) {
    this.calibration = cal;
  }

  /** 맵 이미지를 3D 바닥에 텍스처로 깔기 */
  loadMapImage(src: string | HTMLImageElement) {
    const apply = (tex: THREE.Texture) => {
      tex.colorSpace = THREE.SRGBColorSpace;

      if (this.mapPlane) {
        this.scene.remove(this.mapPlane);
        this.mapPlane.geometry.dispose();
        const oldMat = this.mapPlane.material as THREE.MeshStandardMaterial;
        oldMat.map?.dispose();
        oldMat.dispose();
      }

      const w = this.calibration?.realWidthM ?? 50;
      const h = this.calibration?.realHeightM ?? 28;
      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1 });

      this.mapPlane = new THREE.Mesh(geo, mat);
      this.mapPlane.rotation.x = -Math.PI / 2;
      this.mapPlane.position.y = 0.01;
      this.scene.add(this.mapPlane);
    };

    if (typeof src === "string") {
      new THREE.TextureLoader().load(src, apply);
    } else {
      const tex = new THREE.Texture(src);
      tex.needsUpdate = true;
      apply(tex);
    }
  }

  // ───────────────────────────────────────────────────────
  // 벽 그리기
  // ───────────────────────────────────────────────────────

  startWallDrawing() {
    this.wallDrawing = true;
    this.clearWallPoints();
  }

  stopWallDrawing() {
    this.wallDrawing = false;
  }

  isWallDrawing(): boolean {
    return this.wallDrawing;
  }

  /** 월드 좌표로 벽 점 직접 추가 */
  addWallPointWorld(x: number, z: number) {
    if (!this.wallDrawing) return;
    if (this.wallPointsCount() >= 512) return;

    // 마커 표시
    const marker = new THREE.Mesh(this.markerGeo, this.markerMat);
    marker.position.set(x, 0.05, z);
    this.wallMarkers.add(marker);

    // 프리뷰 라인 갱신
    const n = this.wallPointsCount() + 1;
    this.previewPositions[(n - 1) * 3] = x;
    this.previewPositions[(n - 1) * 3 + 1] = 0.05;
    this.previewPositions[(n - 1) * 3 + 2] = z;
    this.previewGeo.setDrawRange(0, n);
    (this.previewGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate =
      true;

    this.pendingPoints.push({ x, z });
    this.onWallPointAddedCb?.({ x, z });
  }

  private pendingPoints: WorldPoint[] = [];

  private wallPointsCount(): number {
    return this.pendingPoints.length;
  }

  /** 현재 찍은 점들 초기화 (벽은 유지) */
  clearWallPoints() {
    this.pendingPoints = [];
    while (this.wallMarkers.children.length > 0) {
      this.wallMarkers.remove(this.wallMarkers.children[0]);
    }
    this.previewGeo.setDrawRange(0, 0);
  }

  /** 현재 그린 폴리라인 루프를 닫아 3D 월 생성 */
  closeWallLoop(opts?: WallOptions): string {
    if (this.pendingPoints.length < 3) {
      throw new Error("벽 생성을 위해서는 최소 3개 이상의 점이 필요합니다.");
    }
    const wallId = this.wallBuilder.buildWall(
      this.pendingPoints,
      opts ?? { heightM: 3, thicknessM: 0.15 }
    );
    const mesh = this.wallBuilder.getWall(wallId)!;
    this.clearWallPoints();
    this.onWallCreatedCb?.(wallId, mesh);
    return wallId;
  }

  /** 클릭으로 선택된 벽 삭제 */
  removeSelectedWall() {
    const sel = this.wallBuilder.getSelected();
    if (sel) this.wallBuilder.removeWall(sel);
  }

  /** 생성된 모든 3D 월 삭제 */
  clearWalls() {
    this.wallBuilder.clearAll();
  }

  getWallCount(): number {
    return this.wallBuilder.getWallCount();
  }

  // ───────────────────────────────────────────────────────
  // 로봇
  // ───────────────────────────────────────────────────────

  /** 로봇 좌표 수신 (신규 등록 또는 목표 갱신, 렌더는 Lerp 보간) */
  updateRobotPose(pose: RobotPose) {
    this.robotManager.updateRobotPose(pose);
  }

  removeRobot(id: string) {
    this.robotManager.removeRobot(id);
  }

  clearRobots() {
    this.robotManager.clearAll();
  }

  getRobotCount(): number {
    return this.robotManager.getRobotCount();
  }

  // ───────────────────────────────────────────────────────
  // 카메라 프리셋
  // ───────────────────────────────────────────────────────

  /** 정상단(top-down) 뷰 — 외곽선 그리기에 유용 */
  setTopView() {
    this.camera.position.set(0, 60, 0.001);
    this.controls.target.set(0, 0, 0);
    this.camera.lookAt(0, 0, 0);
    this.controls.update();
  }

  // ───────────────────────────────────────────────────────
  // 이벤트 / 기타
  // ───────────────────────────────────────────────────────

  onWallCreated(cb: (wallId: string, mesh: THREE.Mesh) => void) {
    this.onWallCreatedCb = cb;
  }

  onWallPointAdded(cb: (point: WorldPoint) => void) {
    this.onWallPointAddedCb = cb;
  }

  /** 벽 클릭 선택/해제 (null = 해제) */
  onWallSelected(cb: (wallId: string | null) => void) {
    this.onWallSelectedCb = cb;
  }

  /** 로봇 클릭 */
  onRobotClick(cb: (robotId: string) => void) {
    this.onRobotClickCb = cb;
  }

  dispose() {
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointerDown);
    this.renderer.domElement.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("resize", this.handleResize);
    this.controls.dispose();
    this.renderer.dispose();
    this.wallBuilder.clearAll();
    this.robotManager.dispose();
  }

  getThreeScene(): THREE.Scene {
    return this.scene;
  }

  getThreeRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getThreeCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
