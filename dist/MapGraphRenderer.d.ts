import { MapGraphData, MapGraphEdge, MapGraphOptions, WorldPoint } from './types';
import * as THREE from "three";
/** 노드 종류별 색상 (데모룸 MapLayers 아이콘 규칙과 동일 분류) */
export declare const NODE_KIND_COLOR: Record<string, number>;
/**
 * 맵 그래프(노드/엣지) 3D 렌더러
 * - 노드: InstancedMesh(실린더 마커) + 종류별 색상 + ID 라벨 스프라이트
 * - 엣지: 단일 LineSegments (vertex color)
 *   · roadType 지정 엣지는 앰버, 일반은 슬레이트
 *   · 일방통행 엣지(역방향 엣지가 없는 경우)는 진행 방향 화살표 콘
 * - 피킹: 노드(InstancedMesh instanceId), 엣지(Line raycast)
 */
export declare class MapGraphRenderer {
    private scene;
    private group;
    private nodeMesh;
    private nodeIds;
    private nodeKindColors;
    private nodePositions;
    private lineSegments;
    private lineColorAttr;
    private edgeList;
    private arrowMesh;
    private arrowsVisible;
    private highlightedNodes;
    private highlightedEdges;
    private options;
    constructor(scene: THREE.Scene);
    /** 맵 그래프 로드 (기존 그래프는 교체) */
    load(graph: MapGraphData, options?: Partial<MapGraphOptions>): void;
    /**
     * 시작 → 목적지 노드의 최단 경로 (Dijkstra).
     * 가중치 = edgeLengthM ?? 노드 간 유클리드 거리, 엣지는 벤더 규약대로 방향성(start→end) 적용.
     * @returns 노드 ID 배열 (start 포함) — 경로가 없으면 null
     */
    findPath(startNodeId: string, endNodeId: string): string[] | null;
    /** 노드의 월드 좌표 (없으면 null) */
    getGraphNodePosition(nodeId: string): WorldPoint | null;
    /** 좌표에서 가장 가까운 노드 ID */
    findNearestNode(p: WorldPoint): string | null;
    /**
     * 노드 경로 하이라이트 — 노드 + 연속 노드쌍에 대응하는 엣지를 자동 매칭해 함께 표시
     * (엣지 ID 형식과 무관하게 startNodeId/endNodeId로 매칭)
     */
    highlightPath(nodeIds: string[]): void;
    /** 레이캐스트 → 클릭된 노드 ID */
    raycastNode(raycaster: THREE.Raycaster): string | null;
    /** 레이캐스트 → 클릭된 엣지 (raycaster.params.Line.threshold 필요) */
    raycastEdge(raycaster: THREE.Raycaster): {
        key: string;
        edge: MapGraphEdge;
    } | null;
    /** 노드 하이라이트 (기존 하이라이트 대체) */
    highlightNodes(nodeIds: string[]): void;
    /** 엣지 하이라이트 (기존 하이라이트 대체). key: edgeId 또는 "start-end" */
    highlightEdges(edgeKeys: string[]): void;
    clearHighlights(): void;
    private refreshNodeInstances;
    private refreshEdgeColors;
    setVisible(visible: boolean): void;
    isVisible(): boolean;
    /** 일방통행 방향 화살표 표시/숨김 */
    setArrowsVisible(visible: boolean): void;
    getNodeCount(): number;
    getEdgeCount(): number;
    clear(): void;
    private disposeChild;
    dispose(): void;
}
