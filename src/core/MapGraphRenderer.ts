import * as THREE from "three";
import type {
  MapGraphData,
  MapGraphNode,
  MapGraphOptions,
} from "./types";

/** 노드 종류별 색상 (데모룸 MapLayers 아이콘 규칙과 동일 분류) */
export const NODE_KIND_COLOR: Record<string, number> = {
  charge: 0xf59e0b, // 충전노드 — 앰버
  rack: 0x8b5cf6, // 랙 — 바이올렛
  container: 0xf97316, // 컨테이너 — 오렌지
  function: 0x38bdf8, // 기능노드 — 하늘색
  parking: 0x2dd4bf, // 대기노드 (Axbis nodeType 2, idleParking) — 틸
  normal: 0x22d3ee, // 일반 — 시안
};

const HIGHLIGHT_COLOR = 0x2563eb;
const EDGE_COLOR = 0x64748b;

/** kind 미지정 시 nodeId 패턴으로 추론 (데모룸 규칙: RACK*, T숫자) */
function inferKind(node: MapGraphNode): string {
  if (node.kind) return node.kind;
  const id = node.nodeId.toUpperCase();
  if (id.startsWith("RACK")) return "rack";
  if (/^T\d+$/.test(id)) return "charge";
  return "normal";
}

/** 캔버스 텍스처 기반 노드 ID 라벨 스프라이트 */
function makeTextSprite(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const pad = 10;
  const font = "bold 44px ui-monospace, SFMono-Regular, monospace";
  const measure = canvas.getContext("2d")!;
  measure.font = font;
  const tw = Math.ceil(measure.measureText(text).width);
  canvas.width = tw + pad * 2;
  canvas.height = 60;

  const ctx = canvas.getContext("2d")!;
  ctx.font = font; // 캔버스 크기 지정 후 재설정 필요
  ctx.fillStyle = "rgba(2, 6, 23, 0.78)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, pad, canvas.height / 2 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  );
  const h = 0.5; // 월드 높이 (m)
  sprite.scale.set((h * canvas.width) / canvas.height, h, 1);
  sprite.renderOrder = 10;
  sprite.raycast = () => {}; // 라벨은 클릭 피킹 대상에서 제외
  return sprite;
}

/**
 * 맵 그래프(노드/엣지) 3D 렌더러
 * - 노드: InstancedMesh(실린더 마커) + 종류별 색상 + ID 라벨 스프라이트
 * - 엣지: 단일 LineSegments (vertex color) → 하이라이트 시 색만 갱신 (저렴함)
 * - 노드 클릭 피킹: instanceId → nodeId
 */
export class MapGraphRenderer {
  private scene: THREE.Scene;
  private group = new THREE.Group();

  private nodeMesh: THREE.InstancedMesh | null = null;
  private nodeIds: string[] = [];
  private nodeKindColors: THREE.Color[] = [];
  private nodePositions = new Map<string, { x: number; z: number }>();

  private lineColors: Float32Array | null = null;
  private lineColorAttr: THREE.BufferAttribute | null = null;
  private edgeVertex = new Map<string, number>(); // edgeKey → 첫 정점 오프셋

  private highlightedNodes = new Set<string>();
  private highlightedEdges = new Set<string>();

  private options: Required<MapGraphOptions> = {
    unit: "mm",
    flipZ: false,
    showLabels: true,
    nodeSize: 0.4,
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group.name = "AcsMapGraph";
    scene.add(this.group);
  }

  /** 맵 그래프 로드 (기존 그래프는 교체) */
  load(graph: MapGraphData, options?: Partial<MapGraphOptions>) {
    this.clear();
    if (options) this.options = { ...this.options, ...options };

    const scale = this.options.unit === "m" ? 1 : 0.001;
    const zSign = this.options.flipZ ? -1 : 1;

    // 1) 노드 수집 (좌표 유효한 것만)
    const valid: Array<{ node: MapGraphNode; x: number; z: number }> = [];
    for (const node of graph.nodes ?? []) {
      const x = Number(node.nodePosition?.x);
      const y = Number(node.nodePosition?.y);
      if (isNaN(x) || isNaN(y)) continue;
      const wx = x * scale;
      const wz = zSign * y * scale;
      valid.push({ node, x: wx, z: wz });
      this.nodePositions.set(node.nodeId, { x: wx, z: wz });
    }

    // 2) 노드 마커 (InstancedMesh)
    if (valid.length > 0) {
      const size = this.options.nodeSize;
      const geo = new THREE.CylinderGeometry(size, size, 0.06, 24);
      const mat = new THREE.MeshBasicMaterial();
      this.nodeMesh = new THREE.InstancedMesh(geo, mat, valid.length);
      this.nodeMesh.frustumCulled = false;
      this.nodeMesh.name = "AcsGraphNodes";

      const dummy = new THREE.Object3D();
      valid.forEach((v, i) => {
        this.nodeIds.push(v.node.nodeId);
        const kindColor = new THREE.Color(
          NODE_KIND_COLOR[inferKind(v.node)] ?? NODE_KIND_COLOR.normal
        );
        this.nodeKindColors.push(kindColor);

        dummy.position.set(v.x, 0.04, v.z);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        this.nodeMesh!.setMatrixAt(i, dummy.matrix);
        this.nodeMesh!.setColorAt(i, kindColor);
      });
      if (this.nodeMesh.instanceColor) this.nodeMesh.instanceColor.needsUpdate = true;
      this.group.add(this.nodeMesh);
    }

    // 3) 노드 ID 라벨
    if (this.options.showLabels) {
      for (const v of valid) {
        const kindColor = new THREE.Color(
          NODE_KIND_COLOR[inferKind(v.node)] ?? NODE_KIND_COLOR.normal
        );
        const sprite = makeTextSprite(v.node.nodeId, `#${kindColor.getHexString()}`);
        sprite.position.set(v.x, 0.55, v.z);
        this.group.add(sprite);
      }
    }

    // 4) 엣지 (양 끝 노드가 존재하는 것만)
    const edges = (graph.edges ?? []).filter(
      (e) =>
        this.nodePositions.has(e.startNodeId) &&
        this.nodePositions.has(e.endNodeId)
    );
    if (edges.length > 0) {
      const positions = new Float32Array(edges.length * 2 * 3);
      const colors = new Float32Array(edges.length * 2 * 3);
      const def = new THREE.Color(EDGE_COLOR);

      edges.forEach((e, i) => {
        const a = this.nodePositions.get(e.startNodeId)!;
        const b = this.nodePositions.get(e.endNodeId)!;
        positions.set([a.x, 0.05, a.z, b.x, 0.05, b.z], i * 6);
        colors.set([def.r, def.g, def.b, def.r, def.g, def.b], i * 6);
        const key = e.edgeId ?? `${e.startNodeId}-${e.endNodeId}`;
        this.edgeVertex.set(key, i * 2);
      });

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      this.lineColorAttr = new THREE.BufferAttribute(colors, 3);
      geo.setAttribute("color", this.lineColorAttr);

      const lineSegments = new THREE.LineSegments(
        geo,
        new THREE.LineBasicMaterial({ vertexColors: true })
      );
      lineSegments.frustumCulled = false;
      this.group.add(lineSegments);
    }
  }

  // ───────────────────────────────────────────────────────
  // 피킹
  // ───────────────────────────────────────────────────────

  /** 레이캐스트 → 클릭된 노드 ID */
  raycastNode(raycaster: THREE.Raycaster): string | null {
    if (!this.nodeMesh) return null;
    const hits = raycaster.intersectObject(this.nodeMesh);
    const instanceId = hits[0]?.instanceId;
    if (instanceId === undefined || instanceId >= this.nodeIds.length) return null;
    return this.nodeIds[instanceId] ?? null;
  }

  // ───────────────────────────────────────────────────────
  // 하이라이트 (경로 표시용)
  // ───────────────────────────────────────────────────────

  /** 노드 하이라이트 (기존 하이라이트 대체) */
  highlightNodes(nodeIds: string[]) {
    this.highlightedNodes = new Set(nodeIds);
    this.refreshNodeInstances();
  }

  /** 엣지 하이라이트 (기존 하이라이트 대체). key: edgeId 또는 "start-end" */
  highlightEdges(edgeKeys: string[]) {
    this.highlightedEdges = new Set(edgeKeys);
    this.refreshEdgeColors();
  }

  clearHighlights() {
    this.highlightedNodes.clear();
    this.highlightedEdges.clear();
    this.refreshNodeInstances();
    this.refreshEdgeColors();
  }

  private refreshNodeInstances() {
    if (!this.nodeMesh) return;
    const dummy = new THREE.Object3D();
    const hi = new THREE.Color(HIGHLIGHT_COLOR);

    this.nodeIds.forEach((id, i) => {
      const pos = this.nodePositions.get(id)!;
      const on = this.highlightedNodes.has(id);
      dummy.position.set(pos.x, 0.04, pos.z);
      dummy.scale.setScalar(on ? 1.6 : 1);
      dummy.updateMatrix();
      this.nodeMesh!.setMatrixAt(i, dummy.matrix);
      this.nodeMesh!.setColorAt(i, on ? hi : this.nodeKindColors[i]);
    });
    this.nodeMesh.instanceMatrix.needsUpdate = true;
    if (this.nodeMesh.instanceColor) this.nodeMesh.instanceColor.needsUpdate = true;
  }

  private refreshEdgeColors() {
    if (!this.lineColors || !this.lineColorAttr) return;
    const def = new THREE.Color(EDGE_COLOR);
    const hi = new THREE.Color(HIGHLIGHT_COLOR);

    for (const [, off] of this.edgeVertex) {
      const c = this.highlightedEdges.has(
        this.edgeKeyAt(off)
      )
        ? hi
        : def;
      for (const vtx of [off, off + 1]) {
        this.lineColors[vtx * 3] = c.r;
        this.lineColors[vtx * 3 + 1] = c.g;
        this.lineColors[vtx * 3 + 2] = c.b;
      }
    }
    this.lineColorAttr.needsUpdate = true;
  }

  /** 정점 오프셋 → 엣지 키 역 조회 */
  private edgeKeyAt(vertexOffset: number): string {
    for (const [key, off] of this.edgeVertex) {
      if (off === vertexOffset) return key;
    }
    return "";
  }

  // ───────────────────────────────────────────────────────
  // 표시/통계/정리
  // ───────────────────────────────────────────────────────

  setVisible(visible: boolean) {
    this.group.visible = visible;
  }

  isVisible(): boolean {
    return this.group.visible;
  }

  getNodeCount(): number {
    return this.nodeIds.length;
  }

  getEdgeCount(): number {
    return this.edgeVertex.size;
  }

  clear() {
    for (const child of [...this.group.children]) {
      this.group.remove(child);
      this.disposeChild(child);
    }
    this.nodeMesh = null;
    this.nodeIds = [];
    this.nodeKindColors = [];
    this.nodePositions.clear();
    this.lineColors = null;
    this.lineColorAttr = null;
    this.edgeVertex.clear();
    this.highlightedNodes.clear();
    this.highlightedEdges.clear();
  }

  private disposeChild(child: THREE.Object3D) {
    const obj = child as unknown as {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    obj.geometry?.dispose();
    if (Array.isArray(obj.material)) {
      obj.material.forEach((m) => m.dispose());
    } else if (obj.material) {
      const map = (obj.material as THREE.SpriteMaterial).map;
      map?.dispose();
      obj.material.dispose();
    }
  }

  dispose() {
    this.clear();
    this.scene.remove(this.group);
  }
}
