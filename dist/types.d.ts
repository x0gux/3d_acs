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
    resolutionMPerPx?: number;
}
/** 지도 메타데이터 (ROS map_server YAML / Axbis 맵 공통) */
export interface MapMeta {
    image?: string;
    resolutionMPerPx?: number;
    originX?: number;
    originY?: number;
    negate?: boolean;
    occupiedThresh?: number;
    freeThresh?: number;
    widthPx?: number;
    heightPx?: number;
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
/** 맵 그래프 노드 (데모룸 /api/maps/{mapId} 규격 호환) */
export interface MapGraphNode {
    nodeId: string;
    nodePosition: {
        x: number | string;
        y: number | string;
        theta?: number | string;
        mapId?: string;
    };
    kind?: string;
    externalCode?: string | null;
}
export interface MapGraphEdge {
    edgeId?: string;
    startNodeId: string;
    endNodeId: string;
}
export interface MapGraphData {
    mapId?: string;
    mapName?: string;
    nodes: MapGraphNode[];
    edges: MapGraphEdge[];
}
export interface MapGraphOptions {
    /** 노드 좌표 단위 (기본 mm — 데모룸 규약) */
    unit?: "mm" | "m";
    /** 노드 y축 부호 반전 (이미지 좌표계: 위=0, 아래로 증가일 때 true) */
    flipZ?: boolean;
    /** 노드 ID 라벨 표시 (기본 true) */
    showLabels?: boolean;
    /** 노드 마커 반지름 (m, 기본 0.4) */
    nodeSize?: number;
}
