import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type {
  AcsViewerOptions,
  MapCalibration,
  MapMeta,
  WallOptions,
  WallFadeOptions,
  RobotPose,
  WorldPoint,
  MapGraphData,
  MapGraphOptions,
} from "./types";
import { WallBuilder } from "./WallBuilder";
import { RobotManager } from "./RobotManager";
import { MapGraphRenderer } from "./MapGraphRenderer";

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
  private mapGraph: MapGraphRenderer;
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

  private onWallCreatedCb?: (wallId: string, mesh: THREE.Object3D) => void;
  private onWallPointAddedCb?: (point: WorldPoint) => void;
  private onWallSelectedCb?: (wallId: string | null) => void;
  private onRobotClickCb?: (robotId: string) => void;
  private onNodeClickCb?: (nodeId: string) => void;

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

    // 맵 그래프 노드 피킹
    const nodeId = this.mapGraph.raycastNode(this.raycaster);
    if (nodeId) {
      this.onNodeClickCb?.(nodeId);
      return;
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
    // 카메라에 가려지는 앞쪽 벽 자동 반투명(뷰 의존적 페이드)
    this.wallBuilder.updateViewDependentOpacity(this.camera, dt);
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
    this.wallBuilder = new WallBuilder(this.scene, options.wallFade);
    this.robotManager = new RobotManager(this.scene);
    this.mapGraph = new MapGraphRenderer(this.scene);

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

  /**
   * 맵 이미지를 3D 바닥에 텍스처로 깔기
   * @param src 이미지 URL, HTMLImageElement, 또는 오프스크린 캔버스(PGM 변환 결과)
   * @param meta resolution/origin 메타데이터 (ROS YAML 규약)
   *             - resolutionMPerPx가 있으면: 평면 크기 = px × 해상도
   *             - origin이 있으면: 이미지 좌하단을 해당 월드 좌표에 배치 (이미지 위쪽 = +Z 북쪽)
   *             - 없으면: 맵 중심이 원점에 오도록 배치
   */
  loadMapImage(
    src: string | HTMLImageElement | HTMLCanvasElement,
    meta?: MapMeta
  ) {
    const apply = (tex: THREE.Texture) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = false; // 이미지 위쪽 = +Z (ROS 북쪽 규약 통일)

      // 기존 맵 평면 정리
      if (this.mapPlane) {
        this.scene.remove(this.mapPlane);
        this.mapPlane.geometry.dispose();
        const oldMat = this.mapPlane.material as THREE.MeshStandardMaterial;
        oldMat.map?.dispose();
        oldMat.dispose();
      }

      const widthPx = meta?.widthPx ?? this.calibration?.imageWidthPx ?? 1024;
      const heightPx = meta?.heightPx ?? this.calibration?.imageHeightPx ?? 1024;
      const res = meta?.resolutionMPerPx ?? this.calibration?.resolutionMPerPx;
      const w = res != null ? widthPx * res : (this.calibration?.realWidthM ?? 50);
      const h = res != null ? heightPx * res : (this.calibration?.realHeightM ?? 28);

      // 원점 결정: meta 우선 → 기존 캘리브레이션 → 중앙 정렬
      let ox: number;
      let oy: number;
      if (meta?.originX !== undefined || meta?.originY !== undefined) {
        ox = meta.originX ?? 0;
        oy = meta.originY ?? 0;
      } else if (
        this.calibration?.originX !== undefined ||
        this.calibration?.originY !== undefined
      ) {
        ox = this.calibration.originX ?? 0;
        oy = this.calibration.originY ?? 0;
      } else {
        ox = -w / 2;
        oy = -h / 2;
      }

      this.calibration = {
        imageWidthPx: widthPx,
        imageHeightPx: heightPx,
        realWidthM: w,
        realHeightM: h,
        originX: ox,
        originY: oy,
        resolutionMPerPx: res ?? undefined,
      };

      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1 });

      this.mapPlane = new THREE.Mesh(geo, mat);
      this.mapPlane.rotation.x = -Math.PI / 2;
      // 이미지 좌하단을 (ox, oy)에 맞춤 (ROS 원점 규약)
      this.mapPlane.position.set(ox + w / 2, 0.01, oy + h / 2);
      this.scene.add(this.mapPlane);
    };

    if (typeof src === "string") {
      new THREE.TextureLoader().load(src, apply);
    } else {
      const tex =
        src instanceof HTMLCanvasElement
          ? new THREE.CanvasTexture(src)
          : new THREE.Texture(src);
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

  // ───────────────────────────────────────────────────────
  // 벽 뷰 의존적 페이드 (카메라에 가려지는 앞벽 자동 반투명)
  // ───────────────────────────────────────────────────────

  /** 앞벽 자동 반투명 페이드 켜기/끄기 (끄면 모든 벽이 불투명으로 복원) */
  setWallFadeEnabled(enabled: boolean) {
    this.wallBuilder.setFadeEnabled(enabled);
  }

  isWallFadeEnabled(): boolean {
    return this.wallBuilder.isFadeEnabled();
  }

  /** 페이드 세부 옵션 조정 (minOpacity / fadeStart / fadeEnd / fadeSpeed) */
  setWallFadeOptions(opts: Partial<WallFadeOptions>) {
    this.wallBuilder.setFadeOptions(opts);
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
  // 맵 그래프 (노드/엣지)
  // ───────────────────────────────────────────────────────

  /** 맵 그래프 로드 (데모룸 /api/maps/{mapId} 규격 JSON과 호환) */
  loadMapGraph(graph: MapGraphData, options?: MapGraphOptions) {
    this.mapGraph.load(graph, options);
  }

  /** REST API에서 맵 그래프 조회 후 로드 (예: ${API_BASE}/api/maps/{mapId}) */
  async loadMapGraphFromUrl(url: string, options?: MapGraphOptions): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`맵 그래프 조회 실패: ${res.status}`);
    const data = (await res.json()) as MapGraphData;
    this.loadMapGraph(data, options);
  }

  clearMapGraph() {
    this.mapGraph.clear();
  }

  setGraphVisible(visible: boolean) {
    this.mapGraph.setVisible(visible);
  }

  /** 경로상 노드 하이라이트 (로봇 계획 경로 표시용) */
  highlightGraphNodes(nodeIds: string[]) {
    this.mapGraph.highlightNodes(nodeIds);
  }

  /** 경로상 엣지 하이라이트. key: edgeId 또는 "startNodeId-endNodeId" */
  highlightGraphEdges(edgeKeys: string[]) {
    this.mapGraph.highlightEdges(edgeKeys);
  }

  clearGraphHighlights() {
    this.mapGraph.clearHighlights();
  }

  getGraphNodeCount(): number {
    return this.mapGraph.getNodeCount();
  }

  getGraphEdgeCount(): number {
    return this.mapGraph.getEdgeCount();
  }

  // ───────────────────────────────────────────────────────
  // 카메라 프리셋
  // ───────────────────────────────────────────────────────

  /** 정상단(top-down) 뷰 — 외곽선 그리기/맵 확인에 유용 (중심·높이 지정 가능) */
  setTopView(centerX = 0, centerZ = 0, height = 60) {
    this.camera.position.set(centerX, height, centerZ + 0.001);
    this.controls.target.set(centerX, 0, centerZ);
    this.camera.lookAt(centerX, 0, centerZ);
    this.controls.update();
  }

  // ───────────────────────────────────────────────────────
  // 이벤트 / 기타
  // ───────────────────────────────────────────────────────

  onWallCreated(cb: (wallId: string, mesh: THREE.Object3D) => void) {
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

  /** 맵 그래프 노드 클릭 */
  onNodeClick(cb: (nodeId: string) => void) {
    this.onNodeClickCb = cb;
  }

  dispose() {
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointerDown);
    this.renderer.domElement.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("resize", this.handleResize);
    this.controls.dispose();
    this.renderer.dispose();
    this.wallBuilder.clearAll();
    this.robotManager.dispose();
    this.mapGraph.dispose();
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
