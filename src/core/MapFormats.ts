import type { MapGraphData, MapGraphEdge, MapGraphNode, MapMeta } from "./types";

// ─────────────────────────────────────────────────────────
// PGM (P5 바이너리 / P2 ASCII) 파싱
// ─────────────────────────────────────────────────────────

export interface PgmImage {
  width: number;
  height: number;
  /** 0~255로 정규화된 명도 (maxval 무관, 0=검정 255=흰색) */
  gray: Uint8Array;
}

const isWhitespace = (b: number) =>
  b === 0x20 || b === 0x09 || b === 0x0a || b === 0x0d;

/**
 * PGM 파일을 파싱합니다.
 * - P5: 바이너리 그레이스케일 (ROS/SLAM 지도 표준)
 * - P2: ASCII 그레이스케일
 * - maxval이 255가 아니어도 0~255로 정규화, 16비트(maxval>255) 지원
 */
export function parsePGM(buffer: ArrayBuffer): PgmImage {
  const bytes = new Uint8Array(buffer);
  let pos = 0;

  const readToken = (): string => {
    // 공백/주석(#) 건너뛰기
    for (;;) {
      while (pos < bytes.length && isWhitespace(bytes[pos])) pos++;
      if (pos < bytes.length && bytes[pos] === 0x23) {
        while (pos < bytes.length && bytes[pos] !== 0x0a) pos++;
        continue;
      }
      break;
    }
    let tok = "";
    while (pos < bytes.length && !isWhitespace(bytes[pos])) {
      tok += String.fromCharCode(bytes[pos++]);
    }
    return tok;
  };

  const magic = readToken();
  if (magic !== "P5" && magic !== "P2") {
    throw new Error(
      `지원하지 않는 PGM 형식입니다: ${magic} (P5 바이너리 / P2 ASCII만 지원)`
    );
  }
  const width = parseInt(readToken(), 10);
  const height = parseInt(readToken(), 10);
  const maxval = parseInt(readToken(), 10);
  if (!width || !height || !Number.isFinite(maxval) || maxval <= 0) {
    throw new Error("PGM 헤더가 올바르지 않습니다.");
  }

  const n = width * height;
  const gray = new Uint8Array(n);

  if (magic === "P5") {
    pos++; // maxval 뒤 단일 공백 1바이트
    if (maxval < 256) {
      for (let i = 0; i < n; i++) {
        gray[i] = Math.round((bytes[pos + i] * 255) / maxval);
      }
    } else {
      // 2바이트(big-endian) 샘플
      for (let i = 0; i < n; i++) {
        const v = (bytes[pos + i * 2] << 8) | bytes[pos + i * 2 + 1];
        gray[i] = Math.round((v * 255) / maxval);
      }
    }
  } else {
    for (let i = 0; i < n; i++) {
      const v = parseInt(readToken(), 10);
      gray[i] = Math.round(((Number.isNaN(v) ? 0 : v) * 255) / maxval);
    }
  }

  return { width, height, gray };
}

// ─────────────────────────────────────────────────────────
// OpenCV 스타일 YAML 파싱 (ROS map_server 메타데이터)
// ─────────────────────────────────────────────────────────

/**
 * ROS/OpenCV 스타일 YAML을 파싱합니다.
 * 예: resolution: 0.05 / origin: [0.0, 0.0, 0.0] / occupied_thresh: 0.5
 */
export function parseMapYaml(text: string): MapMeta {
  const meta: MapMeta = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = (raw.split("#")[0] ?? "").trim();
    if (!line || line.startsWith("%")) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();

    switch (key) {
      case "image":
        meta.image = value.replace(/["']/g, "");
        break;
      case "resolution": {
        const v = parseFloat(value);
        if (Number.isFinite(v)) meta.resolutionMPerPx = v;
        break;
      }
      case "origin": {
        const nums = value
          .replace(/[\[\]]/g, "")
          .split(",")
          .map((s) => parseFloat(s.trim()));
        if (
          nums.length >= 2 &&
          Number.isFinite(nums[0]) &&
          Number.isFinite(nums[1])
        ) {
          meta.originX = nums[0];
          meta.originY = nums[1];
        }
        break;
      }
      case "negate":
        meta.negate = parseInt(value, 10) === 1;
        break;
      case "occupied_thresh": {
        const v = parseFloat(value);
        if (Number.isFinite(v)) meta.occupiedThresh = v;
        break;
      }
      case "free_thresh": {
        const v = parseFloat(value);
        if (Number.isFinite(v)) meta.freeThresh = v;
        break;
      }
    }
  }
  return meta;
}

// ─────────────────────────────────────────────────────────
// PGM → 점유 상태 컬러 캔버스 (ROS 규약)
// ─────────────────────────────────────────────────────────

/**
 * PGM 명도 → 점유 상태 컬러 캔버스
 * - 점유(벽/장애물): 진한 슬레이트 #1e293b
 * - 자유공간: 밝은 슬레이트 #e2e8f0
 * - 미확인: 씬 배경색 #0b1120
 */
export function pgmToCanvas(
  pgm: PgmImage,
  meta: MapMeta = {}
): HTMLCanvasElement {
  const { width, height, gray } = pgm;
  const negate = meta.negate ?? false;
  const occT = meta.occupiedThresh ?? 0.65;
  const freeT = meta.freeThresh ?? 0.196;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(width, height);
  const d = img.data;

  for (let i = 0; i < width * height; i++) {
    const p = gray[i]; // 0(검정)~255(흰색)
    const occupancy = (negate ? p : 255 - p) / 255;
    let r: number, g: number, b: number;
    if (occupancy > occT) {
      r = 0x1e; g = 0x29; b = 0x3b; // 점유
    } else if (occupancy < freeT) {
      r = 0xe2; g = 0xe8; b = 0xf0; // 자유공간
    } else {
      r = 0x0b; g = 0x11; b = 0x20; // 미확인
    }
    d[i * 4] = r;
    d[i * 4 + 1] = g;
    d[i * 4 + 2] = b;
    d[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// ─────────────────────────────────────────────────────────
// Axbis 비즈니스 맵 JSON → MapGraphData 변환
// ─────────────────────────────────────────────────────────

export interface AxbisFloorInfo {
  name: string;
  lengthM: number;
  widthM: number;
  version: string;
}

interface AxbisNodeRaw {
  nodeLabel?: string | number;
  nodeUuid?: string;
  nodeNumber?: number;
  nodeType?: number;
  xCoordinate?: number;
  yCoordinate?: number;
}

interface AxbisEdgeRaw {
  edgeLabel?: string | number;
  edgeNumber?: number;
  beginNodeLabel?: string | number;
  endNodeLabel?: string | number;
}

interface AxbisFloorRaw {
  floorNumber?: string;
  floorName?: string;
  floorLength?: number;
  floorWidth?: number;
  floorMapVersion?: string;
  nodeList?: AxbisNodeRaw[];
  edgeList?: AxbisEdgeRaw[];
}

/**
 * Axbis 비즈니스 맵 JSON(floorList 구조)을 MapGraphData로 변환합니다.
 * - nodeId: nodeLabel (엣지가 begin/endNodeLabel로 참조하므로)
 * - 좌표: xCoordinate/yCoordinate (미터) → unit "m"으로 로드할 것
 * - nodeType: 1=일반, 2=대기노드(idleParking) → kind "parking"
 */
export function convertAxbisBusinessMap(json: unknown): {
  graph: MapGraphData;
  floorInfo: AxbisFloorInfo | null;
} {
  const data = json as { floorList?: AxbisFloorRaw[]; mapCode?: string };
  const floor = data.floorList?.[0];
  if (!floor) {
    throw new Error(
      "floorList가 없는 맵 JSON입니다. (Axbis 비즈니스 맵 규격 확인)"
    );
  }

  const nodes: MapGraphNode[] = (floor.nodeList ?? []).map((n) => ({
    nodeId: String(n.nodeLabel ?? n.nodeUuid ?? n.nodeNumber ?? ""),
    nodePosition: {
      x: Number(n.xCoordinate ?? 0),
      y: Number(n.yCoordinate ?? 0),
    },
    kind: n.nodeType === 2 ? "parking" : "normal",
  }));

  const nodeIds = new Set(nodes.map((n) => n.nodeId));
  const edges: MapGraphEdge[] = (floor.edgeList ?? [])
    .map((e) => ({
      edgeId: e.edgeLabel != null ? String(e.edgeLabel) : undefined,
      startNodeId: String(e.beginNodeLabel ?? ""),
      endNodeId: String(e.endNodeLabel ?? ""),
    }))
    .filter((e) => nodeIds.has(e.startNodeId) && nodeIds.has(e.endNodeId));

  const graph: MapGraphData = {
    mapId: data.mapCode ?? floor.floorNumber,
    mapName: floor.floorName || floor.floorNumber,
    nodes,
    edges,
  };

  const floorInfo: AxbisFloorInfo = {
    name: floor.floorName || floor.floorNumber || "-",
    lengthM: floor.floorLength ?? 0,
    widthM: floor.floorWidth ?? 0,
    version: floor.floorMapVersion ?? "-",
  };

  return { graph, floorInfo };
}

// ─────────────────────────────────────────────────────────
// Axbis 맵 폴더 통합 로더 (PGM + YAML + 비즈니스 JSON)
// ─────────────────────────────────────────────────────────

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
export async function loadAxbisMapFromFiles(
  files: File[]
): Promise<AxbisMapLoadResult> {
  const pgmFile = files.find((f) => /\.pgm$/i.test(f.name));
  const yamlFile = files.find((f) => /\.(yaml|yml)$/i.test(f.name));

  // 비즈니스 맵 JSON: floorList 키를 가진 파일 자동 탐지
  let jsonFile: File | undefined;
  for (const f of files) {
    if (!/\.json$/i.test(f.name)) continue;
    try {
      const parsed = JSON.parse(await f.text()) as { floorList?: unknown };
      if (parsed && Array.isArray(parsed.floorList)) {
        jsonFile = f;
        break;
      }
    } catch {
      // 파싱 실패 파일은 무시
    }
  }

  if (!pgmFile) {
    throw new Error("PGM 지도 파일(.pgm)을 찾을 수 없습니다.");
  }

  const pgm = parsePGM(await pgmFile.arrayBuffer());
  let meta: MapMeta = { widthPx: pgm.width, heightPx: pgm.height };
  if (yamlFile) {
    meta = {
      ...parseMapYaml(await yamlFile.text()),
      widthPx: pgm.width,
      heightPx: pgm.height,
    };
  } else {
    meta.resolutionMPerPx = 0.05; // ROS 관례 기본값
  }

  const canvas = pgmToCanvas(pgm, meta);

  let graph: MapGraphData = { nodes: [], edges: [] };
  let floorInfo: AxbisFloorInfo | null = null;
  if (jsonFile) {
    const converted = convertAxbisBusinessMap(
      JSON.parse(await jsonFile.text())
    );
    graph = converted.graph;
    floorInfo = converted.floorInfo;
  }

  return { canvas, meta, graph, floorInfo };
}
