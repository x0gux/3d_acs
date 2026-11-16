import { RobotPose, WorldPoint } from './types';
import * as THREE from "three";
/** 경로 따라가기 옵션 */
export interface RobotPathOptions {
    /** 이동 속도 (m/s), 기본 1.0 */
    speedMps?: number;
    /** 목적지 도착 시 콜백 */
    onComplete?: (robotId: string) => void;
}
/** 로봇 상태별 색상 (데모룸 모니터링 세맨틱과 동일 규칙) */
export declare const STATUS_COLOR: Record<string, number>;
/**
 * InstancedMesh 기반 로봇 풀
 * - 수백 대 로봇도 드로우 콜 1회로 렌더링
 * - 좌표 수신 간격과 무관하게 클라이언트 Lerp 보간으로 부드러운 이동
 * - 이동 방향 자동 회전 (theta 미제공 시)
 */
export declare class RobotManager {
    private scene;
    private mesh;
    private robots;
    private instanceIndex;
    private dummy;
    private tmpMatrix;
    private tmpColor;
    private count;
    private maxCount;
    constructor(scene: THREE.Scene, maxCount?: number);
    getMesh(): THREE.InstancedMesh;
    getRobotCount(): number;
    /**
     * 로봇 좌표 수신 (신규면 등록, 기존이면 목표 갱신)
     * @param opts.interruptPath true(기본)이면 진행 중인 시뮬레이션 경로를 중단하고
     *        실측 좌표로 전환합니다. 시뮬레이션 틱에서는 false를 넘기세요.
     */
    updateRobotPose(pose: RobotPose, opts?: {
        interruptPath?: boolean;
    }): void;
    removeRobot(id: string): void;
    clearAll(): void;
    /** instanceId → robotId (클릭 피킹용) */
    getRobotIdByInstance(instanceId: number): string | null;
    /** 매 프레임 호출: 경로 진행/보간 + 인스턴스 행렬 갱신 */
    update(dt: number): void;
    /** 경로를 등속으로 진행 → current 갱신, 도착 시 이벤트 발생 */
    private advancePath;
    /** 60초 이상 갱신 없는 로봇 제거 (경로 진행 중인 로봇은 제외) */
    sweepStale(timeoutMs?: number): void;
    private arrivedCbs;
    /**
     * 로봇이 웨이포인트를 따라 등속 이동하도록 경로를 설정합니다 (기존 경로 교체).
     * 실측 좌표(updateRobotPose, interruptPath 기본 true)가 들어오면 경로는 자동 중단됩니다.
     * @returns 성공 여부 (로봇 미존재/웨이포인트 부족 시 false)
     */
    setRobotPath(robotId: string, waypoints: WorldPoint[], options?: RobotPathOptions): boolean;
    /** 진행 중인 경로 이동 중단 (로봇은 현재 위치에 정지) */
    stopRobotPath(robotId: string): void;
    hasRobotPath(robotId: string): boolean;
    /** 로봇의 현재 렌더 위치 (없으면 null) */
    getRobotPosition(robotId: string): WorldPoint | null;
    /** 경로 이동 완료(목적지 도착) 구독 */
    onRobotArrived(cb: (robotId: string) => void): void;
    dispose(): void;
}
