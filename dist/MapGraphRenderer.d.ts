import { MapGraphData, MapGraphEdge, MapGraphOptions } from './types';
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
