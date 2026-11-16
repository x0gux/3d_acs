import { MapGraphData, MapMeta } from './types';
export interface PgmImage {
    width: number;
    height: number;
    /** 0~255로 정규화된 명도 (maxval 무관, 0=검정 255=흰색) */
    gray: Uint8Array;
}
/**
 * PGM 파일을 파싱합니다.
 * - P5: 바이너리 그레이스케일 (ROS/SLAM 지도 표준)
 * - P2: ASCII 그레이스케일
 * - maxval이 255가 아니어도 0~255로 정규화, 16비트(maxval>255) 지원
 */
export declare function parsePGM(buffer: ArrayBuffer): PgmImage;
/**
 * ROS/OpenCV 스타일 YAML을 파싱합니다.
 * 예: resolution: 0.05 / origin: [0.0, 0.0, 0.0] / occupied_thresh: 0.5
 */
export declare function parseMapYaml(text: string): MapMeta;
/**
 * PGM 명도 → 점유 상태 컬러 캔버스
 * - 점유(벽/장애물): 진한 슬레이트 #1e293b
 * - 자유공간: 밝은 슬레이트 #e2e8f0
 * - 미확인: 씬 배경색 #0b1120
 */
export declare function pgmToCanvas(pgm: PgmImage, meta?: MapMeta): HTMLCanvasElement;
export interface AxbisFloorInfo {
    name: string;
    lengthM: number;
    widthM: number;
    version: string;
}
/**
 * Axbis 비즈니스 맵 JSON(floorList 구조)을 MapGraphData로 변환합니다.
 * - nodeId: nodeLabel (엣지가 begin/endNodeLabel로 참조하므로)
 * - 좌표: xCoordinate/yCoordinate (미터) → unit "m"으로 로드할 것
 * - nodeType: 1=일반, 2=대기노드(idleParking) → kind "parking"
 */
export declare function convertAxbisBusinessMap(json: unknown): {
    graph: MapGraphData;
    floorInfo: AxbisFloorInfo | null;
};
export interface AxbisMapLoadResult {
    canvas: HTMLCanvasElement;
    meta: MapMeta;
    graph: MapGraphData;
    floorInfo: AxbisFloorInfo | null;
}
/**
 * Axbis 맵 내보내기 폴더의 파일들을 받아 한 번에 로드합니다.
 * - .pgm  → 점유격자 지도 (필수)
 * - .yaml → resolution/origin/threshold (있으면 적용)
 * - .json → floorList 구조 비즈니스 맵 (있으면 노드/엣지 그래프)
 * - .bin/.xml 등은 무시
 */
export declare function loadAxbisMapFromFiles(files: File[]): Promise<AxbisMapLoadResult>;
