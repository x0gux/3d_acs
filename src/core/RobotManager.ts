import * as THREE from "three";
import type { RobotPose } from "./types";

/** 로봇 상태별 색상 (데모룸 모니터링 세맨틱과 동일 규칙) */
export const STATUS_COLOR: Record<string, number> = {
  running: 0x22c55e, // 녹색
  idle: 0x94a3b8, // 회색
  charging: 0x3b82f6, // 파랑
  error: 0xef4444, // 빨강
};

interface RobotState {
  id: string;
  current: { x: number; z: number }; // 렌더링 위치 (보간됨)
  target: { x: number; z: number }; // 최신 수신 위치
  heading: number; // 현재 렌더링 회전 (rad)
  targetHeading: number; // 목표 회전 (rad)
  hasTargetHeading: boolean;
  status: string;
  lastUpdate: number;
}

/**
 * InstancedMesh 기반 로봇 풀
 * - 수백 대 로봇도 드로우 콜 1회로 렌더링
 * - 좌표 수신 간격과 무관하게 클라이언트 Lerp 보간으로 부드러운 이동
 * - 이동 방향 자동 회전 (theta 미제공 시)
 */
export class RobotManager {
  private scene: THREE.Scene;
  private mesh: THREE.InstancedMesh;
  private robots = new Map<string, RobotState>();
  private instanceIndex = new Map<string, number>();
  private dummy = new THREE.Object3D();
  private tmpMatrix = new THREE.Matrix4();
  private tmpColor = new THREE.Color();
  private count = 0;
  private maxCount: number;

  constructor(scene: THREE.Scene, maxCount = 500) {
    this.scene = scene;
    this.maxCount = maxCount;

    // AGV/AMR 형태: 폭 1.2m × 높이 0.6m × 길이 1.8m
    const geo = new THREE.BoxGeometry(1.2, 0.6, 1.8);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.6 });
    this.mesh = new THREE.InstancedMesh(geo, mat, maxCount);
    this.mesh.count = 0;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false; // 인스턴스 동적 이동 시 컬링 오류 방지
    this.mesh.name = "AcsRobots";

    scene.add(this.mesh);
  }

  getMesh(): THREE.InstancedMesh {
    return this.mesh;
  }

  getRobotCount(): number {
    return this.robots.size;
  }

  /** 로봇 좌표 수신 (신규면 등록, 기존이면 목표 갱신) */
  updateRobotPose(pose: RobotPose) {
    const colorHex = STATUS_COLOR[pose.status] ?? STATUS_COLOR.idle;
    const hasHeading = pose.theta !== undefined && pose.theta !== null;

    let state = this.robots.get(pose.id);
    if (!state) {
      if (this.count >= this.maxCount) return;
      const idx = this.count++;
      this.instanceIndex.set(pose.id, idx);
      this.mesh.count = this.count;

      state = {
        id: pose.id,
        current: { x: pose.x, z: pose.y },
        target: { x: pose.x, z: pose.y },
        heading: hasHeading ? -THREE.MathUtils.degToRad(pose.theta!) : 0,
        targetHeading: hasHeading ? -THREE.MathUtils.degToRad(pose.theta!) : 0,
        hasTargetHeading: hasHeading,
        status: pose.status,
        lastUpdate: Date.now(),
      };
      this.robots.set(pose.id, state);

      // 첫 좌표를 그대로 렌더 위치로
      this.dummy.position.set(state.current.x, 0.3, state.current.z);
      this.dummy.rotation.set(0, state.heading, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(idx, this.dummy.matrix);
    } else {
      state.target = { x: pose.x, z: pose.y };
      state.status = pose.status;
      state.lastUpdate = Date.now();
      state.hasTargetHeading = hasHeading;
      if (hasHeading) {
        state.targetHeading = -THREE.MathUtils.degToRad(pose.theta!);
      }
    }

    // 상태 색상 갱신
    this.tmpColor.setHex(colorHex);
    this.mesh.setColorAt(this.instanceIndex.get(pose.id)!, this.tmpColor);
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  removeRobot(id: string) {
    const idx = this.instanceIndex.get(id);
    if (idx === undefined) return;

    const lastIdx = this.count - 1;
    if (idx !== lastIdx) {
      // 마지막 인스턴스를 빈 슬롯으로 스왑
      let lastOwner: string | null = null;
      for (const [rid, ridx] of this.instanceIndex) {
        if (ridx === lastIdx) {
          lastOwner = rid;
          break;
        }
      }
      if (lastOwner) {
        this.instanceIndex.set(lastOwner, idx);
        this.mesh.getMatrixAt(lastIdx, this.tmpMatrix);
        this.mesh.setMatrixAt(idx, this.tmpMatrix);
        if (this.mesh.instanceColor) {
          this.mesh.getColorAt(lastIdx, this.tmpColor);
          this.mesh.setColorAt(idx, this.tmpColor);
        }
      }
    }

    this.count--;
    this.mesh.count = this.count;
    this.instanceIndex.delete(id);
    this.robots.delete(id);
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  clearAll() {
    this.robots.clear();
    this.instanceIndex.clear();
    this.count = 0;
    this.mesh.count = 0;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /** instanceId → robotId (클릭 피킹용) */
  getRobotIdByInstance(instanceId: number): string | null {
    for (const [id, idx] of this.instanceIndex) {
      if (idx === instanceId) return id;
    }
    return null;
  }

  /** 매 프레임 호출: Lerp 보간 + 인스턴스 행렬 갱신 */
  update(dt: number) {
    if (this.robots.size === 0) return;

    const posLerp = Math.min(1, dt * 3); // 초당 ~3회 수렴 (100ms 수신에도 부드럽게)
    const rotLerp = Math.min(1, dt * 5);

    for (const state of this.robots.values()) {
      // 위치 보간
      const dx = state.target.x - state.current.x;
      const dz = state.target.z - state.current.z;
      state.current.x += dx * posLerp;
      state.current.z += dz * posLerp;

      // 회전: theta 제공 시 목표각, 아니면 이동 방향으로 자동 설정
      if (!state.hasTargetHeading) {
        const dist = Math.hypot(dx, dz);
        if (dist > 0.05) {
          // 박스 길이가 Z축 방향이므로 atan2(dx, dz)
          state.targetHeading = Math.atan2(dx, dz);
        }
      }
      let dTheta = state.targetHeading - state.heading;
      while (dTheta > Math.PI) dTheta -= Math.PI * 2;
      while (dTheta < -Math.PI) dTheta += Math.PI * 2;
      state.heading += dTheta * rotLerp;

      // 인스턴스 행렬 갱신
      const idx = this.instanceIndex.get(state.id)!;
      this.dummy.position.set(state.current.x, 0.3, state.current.z);
      this.dummy.rotation.set(0, state.heading, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(idx, this.dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /** 60초 이상 갱신 없는 로봇 제거 */
  sweepStale(timeoutMs = 60000) {
    const now = Date.now();
    for (const [id, state] of this.robots) {
      if (now - state.lastUpdate >= timeoutMs) {
        this.removeRobot(id);
      }
    }
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.robots.clear();
    this.instanceIndex.clear();
  }
}
