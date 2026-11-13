export interface RobotPose {
    id: string;
    x: number;
    y: number;
    theta?: number;
    status: string;
}
export interface AcsViewerOptions {
    width?: number;
    height?: number;
    backgroundColor?: number;
    fogNear?: number;
    fogFar?: number;
}
/** 맵 캘리브레이션: 이미지 해상도(px)와 실제 크기(m)의 비율 계산용 */
export interface MapCalibration {
    imageWidthPx: number;
    imageHeightPx: number;
    realWidthM: number;
    realHeightM: number;
    originX?: number;
    originY?: number;
}
export interface WallPoint {
    x: number;
    y: number;
}
/** Three.js 월드 좌표 (바닥면 X-Z 평면, 미터) */
export interface WorldPoint {
    x: number;
    z: number;
}
export interface WallOptions {
    heightM: number;
    thicknessM: number;
    color?: number;
}
