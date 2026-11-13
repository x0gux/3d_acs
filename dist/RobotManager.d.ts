import { RobotPose } from './types';
import * as THREE from "three";
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
    /** 로봇 좌표 수신 (신규면 등록, 기존이면 목표 갱신) */
    updateRobotPose(pose: RobotPose): void;
    removeRobot(id: string): void;
    clearAll(): void;
    /** instanceId → robotId (클릭 피킹용) */
    getRobotIdByInstance(instanceId: number): string | null;
    /** 매 프레임 호출: Lerp 보간 + 인스턴스 행렬 갱신 */
    update(dt: number): void;
    /** 60초 이상 갱신 없는 로봇 제거 */
    sweepStale(timeoutMs?: number): void;
    dispose(): void;
}
