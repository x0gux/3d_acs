import { AcsViewerOptions, MapCalibration, WallOptions, RobotPose, WorldPoint } from './types';
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
    /** 맵 이미지를 3D 바닥에 텍스처로 깔기 */
    loadMapImage(src: string | HTMLImageElement): void;
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
    getWallCount(): number;
    /** 로봇 좌표 수신 (신규 등록 또는 목표 갱신, 렌더는 Lerp 보간) */
    updateRobotPose(pose: RobotPose): void;
    removeRobot(id: string): void;
    clearRobots(): void;
    getRobotCount(): number;
    /** 정상단(top-down) 뷰 — 외곽선 그리기에 유용 */
    setTopView(): void;
    onWallCreated(cb: (wallId: string, mesh: THREE.Mesh) => void): void;
    onWallPointAdded(cb: (point: WorldPoint) => void): void;
    /** 벽 클릭 선택/해제 (null = 해제) */
    onWallSelected(cb: (wallId: string | null) => void): void;
    /** 로봇 클릭 */
    onRobotClick(cb: (robotId: string) => void): void;
    dispose(): void;
    getThreeScene(): THREE.Scene;
    getThreeRenderer(): THREE.WebGLRenderer;
    getThreeCamera(): THREE.PerspectiveCamera;
}
