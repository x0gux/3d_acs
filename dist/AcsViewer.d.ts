import { AcsViewerOptions, MapCalibration, MapMeta, WallOptions, WallFadeOptions, RobotPose, WorldPoint, MapGraphData, MapGraphEdge, MapGraphOptions } from './types';
import { PgmImage } from './MapFormats';
import * as THREE from "three";
/**
 * ACS 관제 3D 뷰어 코어 (순수 TypeScript + Three.js)
 * - 어떤 UI 프레임워크에도 의존하지 않음 (HTMLElement만 받음)
 * - 이동/회전/줌: OrbitControls
 * - 벽 그리기: Raycaster로 바닥면(Y=0) 클릭 → 월드 좌표
 * - 로봇: RobotManager(InstancedMesh) + Lerp 보간
 * - 클릭 피킹: 그리기 모드=점 추가 / 아니면 로봇 → 벽 순서로 선택
 */
export declare class AcsViewer {
    private container;
    private scene;
    private camera;
    private renderer;
    private controls;
    private wallBuilder;
    private robotManager;
    private mapGraph;
    private raycaster;
    private clock;
    private calibration;
    private mapPlane;
    private wallDrawing;
    private wallMarkers;
    private markerGeo;
    private markerMat;
    private previewPositions;
    private previewGeo;
    private previewLine;
    private onWallCreatedCb?;
    private onWallPointAddedCb?;
    private onWallSelectedCb?;
    private onRobotClickCb?;
    private onNodeClickCb?;
    private onEdgeClickCb?;
    private downX;
    private downY;
    private handlePointerDown;
    private handlePointerUp;
    private animate;
    constructor(container: HTMLElement, options?: AcsViewerOptions);
    private handleResize;
    /** 화면 좌표로 레이캐스터 설정 */
    private setRaycasterFromScreen;
    /** 화면 클릭 좌표 → 바닥면(Y=0) 교차점 (월드 좌표) */
    private raycastFloor;
    /** 맵 이미지 캘리브레이션 (바닥 텍스처 평면 크기 결정) */
    setMapCalibration(cal: MapCalibration): void;
    /**
     * 맵 이미지를 3D 바닥에 텍스처로 깔기
     * @param src 이미지 URL, HTMLImageElement, 또는 오프스크린 캔버스(PGM 변환 결과)
     * @param meta resolution/origin 메타데이터 (ROS YAML 규약)
     *             - resolutionMPerPx가 있으면: 평면 크기 = px × 해상도
     *             - origin이 있으면: 이미지 좌하단을 해당 월드 좌표에 배치 (이미지 위쪽 = +Z 북쪽)
     *             - 없으면: 맵 중심이 원점에 오도록 배치
     */
    loadMapImage(src: string | HTMLImageElement | HTMLCanvasElement, meta?: MapMeta): void;
    /**
     * PGM 점유격자에서 벽을 자동 생성합니다 (기존 자동 벽은 교체).
     * 외곽 벽 + 내부 장애물(랙/기둥)이 PGM과 픽셀 단위로 일치하게 세워지고,
     * 수동 벽과 동일한 뷰 의존적 페이드(카메라 정면 벽 자동 반투명)가 적용됩니다.
     * @returns 생성된 벽 세그먼트 수
     */
    buildAutoWalls(pgm: PgmImage, meta: MapMeta, options?: {
        heightM?: number;
        color?: number;
        occupiedThresh?: number;
        /** 노이즈 정제: 이 픽셀 수 미만의 점유 덩어리 제거 (기본 4) */
        minComponentPixels?: number;
    }): number;
    /** PGM 자동 벽 제거 */
    clearAutoWalls(): void;
    hasAutoWalls(): boolean;
    startWallDrawing(): void;
    stopWallDrawing(): void;
    isWallDrawing(): boolean;
    /** 월드 좌표로 벽 점 직접 추가 */
    addWallPointWorld(x: number, z: number): void;
    private pendingPoints;
    private wallPointsCount;
    /** 현재 찍은 점들 초기화 (벽은 유지) */
    clearWallPoints(): void;
    /** 현재 그린 폴리라인 루프를 닫아 3D 월 생성 */
    closeWallLoop(opts?: WallOptions): string;
    /** 클릭으로 선택된 벽 삭제 */
    removeSelectedWall(): void;
    /** 생성된 모든 3D 월 삭제 */
    clearWalls(): void;
    /** 앞벽 자동 반투명 페이드 켜기/끄기 (끄면 모든 벽이 불투명으로 복원) */
    setWallFadeEnabled(enabled: boolean): void;
    isWallFadeEnabled(): boolean;
    /** 페이드 세부 옵션 조정 (minOpacity / fadeStart / fadeEnd / fadeSpeed) */
    setWallFadeOptions(opts: Partial<WallFadeOptions>): void;
    getWallCount(): number;
    /**
     * 로봇 좌표 수신 (신규 등록 또는 목표 갱신, 렌더는 Lerp 보간)
     * @param opts.interruptPath true(기본)이면 진행 중인 시뮬레이션 경로를 중단하고 실측 좌표로 전환.
     *        시뮬레이션 틱으로 로봇을 움직일 때는 false를 넘기세요.
     */
    updateRobotPose(pose: RobotPose, opts?: {
        interruptPath?: boolean;
    }): void;
    removeRobot(id: string): void;
    clearRobots(): void;
    getRobotCount(): number;
    /**
     * 로봇이 웨이포인트를 따라 등속 이동합니다 (시뮬레이션).
     * 실측 좌표(updateRobotPose, interruptPath 기본 true)가 들어오면 자동 중단됩니다.
     * @returns 성공 여부
     */
    moveRobotAlongPath(robotId: string, waypoints: WorldPoint[], options?: {
        speedMps?: number;
        onComplete?: (robotId: string) => void;
    }): boolean;
    /** 진행 중인 경로 이동 중단 (로봇은 현재 위치에 정지) */
    stopRobotPath(robotId: string): void;
    hasRobotPath(robotId: string): boolean;
    /** 그래프 상 최단 경로 탐색 → 노드 ID 배열 (경로 없으면 null) */
    findPath(startNodeId: string, endNodeId: string): string[] | null;
    /** 노드의 월드 좌표 */
    getGraphNodePosition(nodeId: string): WorldPoint | null;
    /** 좌표에서 가장 가까운 노드 ID */
    findNearestNode(point: WorldPoint): string | null;
    /** 로봇의 현재 위치에서 가장 가까운 노드 ID */
    findNearestNodeToRobot(robotId: string): string | null;
    /** 노드 경로 하이라이트 (연속 노드쌍 엣지 자동 매칭) */
    highlightGraphPath(nodeIds: string[]): void;
    /**
     * 로봇을 지정 노드까지 그래프 최단 경로로 이동시키는 원스톱 명령 (시뮬레이션).
     * 로봇 현재 위치 → 가장 가까운 노드 → 최단 경로 → 목적지 순서로 웨이포인트를 구성하고
     * 진행 경로(노드/엣지)를 하이라이트합니다.
     * @returns 경과 노드 ID 배열 (로봇 없음/경로 없음이면 null)
     */
    dispatchRobotToNode(robotId: string, targetNodeId: string, options?: {
        speedMps?: number;
    }): string[] | null;
    /** 경로 이동 완료(목적지 도착) 구독 */
    onRobotArrived(cb: (robotId: string) => void): void;
    /** 맵 그래프 로드 (데모룸 /api/maps/{mapId} 규격 JSON과 호환) */
    loadMapGraph(graph: MapGraphData, options?: MapGraphOptions): void;
    /** REST API에서 맵 그래프 조회 후 로드 (예: ${API_BASE}/api/maps/{mapId}) */
    loadMapGraphFromUrl(url: string, options?: MapGraphOptions): Promise<void>;
    clearMapGraph(): void;
    setGraphVisible(visible: boolean): void;
    /** 경로상 노드 하이라이트 (로봇 계획 경로 표시용) */
    highlightGraphNodes(nodeIds: string[]): void;
    /** 경로상 엣지 하이라이트. key: edgeId 또는 "startNodeId-endNodeId" */
    highlightGraphEdges(edgeKeys: string[]): void;
    clearGraphHighlights(): void;
    getGraphNodeCount(): number;
    getGraphEdgeCount(): number;
    /** 정상단(top-down) 뷰 — 외곽선 그리기/맵 확인에 유용 (중심·높이 지정 가능) */
    setTopView(centerX?: number, centerZ?: number, height?: number): void;
    onWallCreated(cb: (wallId: string, mesh: THREE.Object3D) => void): void;
    onWallPointAdded(cb: (point: WorldPoint) => void): void;
    /** 벽 클릭 선택/해제 (null = 해제) */
    onWallSelected(cb: (wallId: string | null) => void): void;
    /** 로봇 클릭 */
    onRobotClick(cb: (robotId: string) => void): void;
    /** 맵 그래프 노드 클릭 */
    onNodeClick(cb: (nodeId: string) => void): void;
    /** 맵 그래프 엣지 클릭 (속성 포함 MapGraphEdge 전달) */
    onEdgeClick(cb: (edge: MapGraphEdge) => void): void;
    dispose(): void;
    getThreeScene(): THREE.Scene;
    getThreeRenderer(): THREE.WebGLRenderer;
    getThreeCamera(): THREE.PerspectiveCamera;
}
