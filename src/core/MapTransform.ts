import type { MapCalibration, WallPoint } from "./types";

/**
 * 맵 이미지 픽셀 좌표(px) ↔ Three.js 월드 좌표(m, 바닥면 X-Z 평면) 변환
 *
 * 이미지 좌표계: 원점 왼쪽 위, Y가 아래로 증가
 * 월드 좌표계: X-Z 평면, Y가 위로 올라감(높이)
 */
export class MapTransform {
  private cal!: MapCalibration;
  private scaleX = 1;
  private scaleY = 1;
  private originX = 0;
  private originY = 0;

  setCalibration(cal: MapCalibration) {
    this.cal = cal;
    this.originX = cal.originX ?? 0;
    this.originY = cal.originY ?? 0;
    this.scaleX = cal.realWidthM / cal.imageWidthPx;
    this.scaleY = cal.realHeightM / cal.imageHeightPx;
  }

  /** 픽셀 하나 → 월드 (x, z) */
  toWorld(px: number, py: number): { x: number; z: number } {
    const cx = this.cal.imageWidthPx / 2;
    const cy = this.cal.imageHeightPx / 2;
    const x = (px - cx) * this.scaleX + this.originX;
    const z = -(py - cy) * this.scaleY + this.originY;
    return { x, z };
  }

  /** 점 배열 → 월드 (x, z) 배열 */
  toWorldPoints(points: WallPoint[]): { x: number; z: number }[] {
    return points.map((p) => this.toWorld(p.x, p.y));
  }
}
