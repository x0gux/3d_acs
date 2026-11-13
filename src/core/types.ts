export interface RobotPose {
  id: string;
  x: number; // 월드 X (m)
  y: number; // 월드 Z (m) — Three.js Z축과 동일하게 전달
  theta?: number; // 회전각 (도). 생략 시 이동 방향으로 자동 회전
  status: string; // running | idle | charging | error ...
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
  imageWidthPx: number;   // 업로드된 맵 이미지 너비 (px)
  imageHeightPx: number;  // 업로드된 맵 이미지 높이 (px)
  realWidthM: number;     // 실제 맵 너비 (미터)
  realHeightM: number;    // 실제 맵 높이 (미터)
  originX?: number;       // 월드 원점 오프셋 X
  originY?: number;       // 월드 원점 오프셋 Y
}

export interface WallPoint {
  x: number; // 캔버스/이미지 기준 X (px)
  y: number; // 캔버스/이미지 기준 Y (px)
}

/** Three.js 월드 좌표 (바닥면 X-Z 평면, 미터) */
export interface WorldPoint {
  x: number;
  z: number;
}

export interface WallOptions {
  heightM: number;    // 벽 높이 (m), 기본 3.0
  thicknessM: number; // 벽 두께 (m), 기본 0.15
  color?: number;     // 벽 색상 (0xRRGGBB)
}
