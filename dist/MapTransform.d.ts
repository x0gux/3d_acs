import { MapCalibration, WallPoint } from './types';
/**
 * 맵 이미지 픽셀 좌표(px) ↔ Three.js 월드 좌표(m, 바닥면 X-Z 평면) 변환
 *
 * 이미지 좌표계: 원점 왼쪽 위, Y가 아래로 증가
 * 월드 좌표계: X-Z 평면, Y가 위로 올라감(높이)
 */
export declare class MapTransform {
    private cal;
    private scaleX;
    private scaleY;
    private originX;
    private originY;
    setCalibration(cal: MapCalibration): void;
    /** 픽셀 하나 → 월드 (x, z) */
    toWorld(px: number, py: number): {
        x: number;
        z: number;
    };
    /** 점 배열 → 월드 (x, z) 배열 */
    toWorldPoints(points: WallPoint[]): {
        x: number;
        z: number;
    }[];
}
