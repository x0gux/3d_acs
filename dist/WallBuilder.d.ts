import { WallOptions, WorldPoint } from './types';
import * as THREE from "three";
/**
 * 바닥면 외곽선 점들을 받아 외곽을 따라 세워지는 3D 벽을 생성합니다.
 *
 * 생성 방식: 각 변(edge)마다 BoxGeometry(두께 × 높이 × 변길이)를 만들고
 * 변 방향으로 회전·배치한 뒤 단일 지오메트리로 병합한다.
 * → 높이(heightM)와 두께(thicknessM)가 독립적으로 반영됨.
 * (변 길이에 두께를 더해 모서리가 맞물리도록 함)
 */
export declare class WallBuilder {
    private scene;
    private walls;
    private counter;
    private selectedId;
    constructor(scene: THREE.Scene);
    /**
     * 월드 포인트 배열 → 3D 벽 메시 생성
     * points: 루프가 닫힌 순서의 바닥면 점들 (미터)
     */
    buildWall(points: WorldPoint[], opts?: WallOptions, color?: number): string;
    getWall(wallId: string): THREE.Mesh | undefined;
    getWallCount(): number;
    getWallIds(): string[];
    /** 벽 선택 (선택된 벽은 emissive로 하이라이트) */
    setSelected(wallId: string | null): void;
    getSelected(): string | null;
    /** 레이캐스트로 가장 가까운 벽 피킹 */
    raycastWalls(raycaster: THREE.Raycaster): {
        wallId: string;
        mesh: THREE.Mesh;
    } | null;
    removeWall(wallId: string): void;
    clearAll(): void;
}
