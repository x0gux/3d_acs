import { WallOptions, WorldPoint, WallFadeOptions } from './types';
import * as THREE from "three";
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
export declare class WallBuilder {
    private scene;
    private walls;
    private counter;
    private selectedId;
    private fade;
    private _v;
    constructor(scene: THREE.Scene, fadeOptions?: Partial<WallFadeOptions>);
    /**
     * 월드 포인트 배열 → 3D 벽 메시 생성 (변 단위 메시들의 Group)
     * points: 루프가 닫힌 순서의 바닥면 점들 (미터)
     */
    buildWall(points: WorldPoint[], opts?: WallOptions, color?: number): string;
    /**
     * 프레임마다 호출. 카메라 위치와 각 세그먼트의 바깥 법선 코사인(s)으로
     * 목표 opacity를 정하고, fadeSpeed 기반 지수 보간으로 부드럽게 전환한다.
     */
    updateViewDependentOpacity(camera: THREE.Camera, dt: number): void;
    setFadeEnabled(enabled: boolean): void;
    isFadeEnabled(): boolean;
    setFadeOptions(opts: Partial<WallFadeOptions>): void;
    getFadeOptions(): Readonly<WallFadeOptions>;
    /** 페이드 비활성화 시 모든 세그먼트를 불투명으로 복원 */
    private resetOpacities;
    getWall(wallId: string): THREE.Object3D | undefined;
    getWallCount(): number;
    getWallIds(): string[];
    /** 벽 선택 (선택된 벽의 모든 세그먼트를 emissive로 하이라이트) */
    setSelected(wallId: string | null): void;
    private setEmissive;
    getSelected(): string | null;
    /** 레이캐스트로 가장 가까운 벽 피킹 */
    raycastWalls(raycaster: THREE.Raycaster): {
        wallId: string;
        mesh: THREE.Mesh;
    } | null;
    removeWall(wallId: string): void;
    private disposeGroup;
    clearAll(): void;
}
