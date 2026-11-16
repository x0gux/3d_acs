import { MapGraphData, MapGraphOptions } from './types';
import * as THREE from "three";
/** 노드 종류별 색상 (데모룸 MapLayers 아이콘 규칙과 동일 분류) */
export declare const NODE_KIND_COLOR: Record<string, number>;
/**
 * 맵 그래프(노드/엣지) 3D 렌더러
 * - 노드: InstancedMesh(실린더 마커) + 종류별 색상 + ID 라벨 스프라이트
 * - 엣지: 단일 LineSegments (vertex color) → 하이라이트 시 색만 갱신 (저렴함)
 * - 노드 클릭 피킹: instanceId → nodeId
 */
export declare class MapGraphRenderer {
    private scene;
    private group;
    private nodeMesh;
    private nodeIds;
    private nodeKindColors;
    private nodePositions;
    private lineColors;
    private lineColorAttr;
    private edgeVertex;
    private highlightedNodes;
    private highlightedEdges;
    private options;
    constructor(scene: THREE.Scene);
    /** 맵 그래프 로드 (기존 그래프는 교체) */
    load(graph: MapGraphData, options?: Partial<MapGraphOptions>): void;
    /** 레이캐스트 → 클릭된 노드 ID */
    raycastNode(raycaster: THREE.Raycaster): string | null;
    /** 노드 하이라이트 (기존 하이라이트 대체) */
    highlightNodes(nodeIds: string[]): void;
    /** 엣지 하이라이트 (기존 하이라이트 대체). key: edgeId 또는 "start-end" */
    highlightEdges(edgeKeys: string[]): void;
    clearHighlights(): void;
    private refreshNodeInstances;
    private refreshEdgeColors;
    /** 정점 오프셋 → 엣지 키 역 조회 */
    private edgeKeyAt;
    setVisible(visible: boolean): void;
    isVisible(): boolean;
    getNodeCount(): number;
    getEdgeCount(): number;
    clear(): void;
    private disposeChild;
    dispose(): void;
}
