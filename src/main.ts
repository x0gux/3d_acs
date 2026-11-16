import { AcsViewer } from "./core/AcsViewer";
import { loadAxbisMapFromFiles } from "./core/MapFormats";
import type {
  MapGraphData,
  MapGraphEdge,
  MapGraphNode,
  MapMeta,
  PgmImage,
} from "./core";
import "./style.css";

/**
 * 지도 업로드 + 반자동 3D 월 생성 + 로봇 모니터링 데모
 *
 * 벽 기능:
 *  - 바닥 클릭으로 외곽선 그리기 → 루프 닫기로 3D 월 생성
 *  - 벽 높이/두께 옵션
 *  - 벽 클릭 선택(하이라이트) → 삭제
 *
 * 로봇 기능:
 *  - 가상 로봇 3대가 웨이포인트 순환 (100ms 좌표 송신 → Lerp 보간 렌더)
 *  - 상태별 색상 (running=녹색, charging=파랑, error=빨강, idle=회색)
 *  - 로봇 클릭 → 콜백 (HUD 표시)
 */

const container = document.getElementById("app")!;
container.style.position = "relative";
container.style.width = "100vw";
container.style.height = "100vh";
container.style.margin = "0";
container.style.background = "#0b1120";
container.style.fontFamily = "sans-serif";
container.style.overflow = "hidden";

const viewer = new AcsViewer(container, {
  backgroundColor: 0x0b1120,
});
viewer.setMapCalibration({
  imageWidthPx: 1920,
  imageHeightPx: 1080,
  realWidthM: 50,
  realHeightM: 28,
});

// ─────────────────────────────────────────────────────────
// 지도 업로드
// ─────────────────────────────────────────────────────────
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*";
fileInput.style.display = "none";
container.appendChild(fileInput);

function loadMapFile(file: File) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    viewer.loadMapImage(img);
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    alert("이미지 로드에 실패했습니다.");
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

fileInput.addEventListener("change", (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) loadMapFile(file);
});

// ─────────────────────────────────────────────────────────
// 상태 HUD
// ─────────────────────────────────────────────────────────
let drawing = false;
let lastRobotClicked = "";
let lastNodeClicked = "";
let lastEdgeInfo = "";
let arrivedInfo = "";
let graphNodeCount = 0;
let graphEdgeCount = 0;
let floorInfoText = "";
let lastPgm: PgmImage | null = null;
let lastMeta: MapMeta | null = null;
let autoWallCount = 0;

const hud = document.createElement("div");
hud.style.cssText =
  "position:absolute;bottom:16px;right:16px;z-index:30;color:#94a3b8;" +
  "font-size:12px;line-height:1.8;pointer-events:none;";
container.appendChild(hud);

let wallPointCount = 0;

function updateHud() {
  hud.innerHTML =
    `<b style="color:#e2e8f0">조작</b> · 좌클릭 드래그: 회전 · 우클릭 드래그: 이동 · 휠: 줌<br>` +
    `생성된 벽: <b style="color:#e2e8f0">${viewer.getWallCount()}</b>개` +
    (autoWallCount > 0
      ? ` · 자동 벽: <b style="color:#e2e8f0">${autoWallCount}</b> 세그먼트`
      : "") +
    (lastRobotClicked
      ? ` · 로봇: <b style="color:#22d3ee">${lastRobotClicked}</b>`
      : "") +
    (lastNodeClicked
      ? ` · 노드: <b style="color:#f59e0b">${lastNodeClicked}</b>`
      : "") +
    (lastEdgeInfo
      ? ` · 엣지: <b style="color:#f59e0b">${lastEdgeInfo}</b>`
      : "") +
    (arrivedInfo ? ` · <b style="color:#22c55e">🅿 도착: ${arrivedInfo}</b>` : "") +
    (graphNodeCount > 0
      ? ` · 그래프: <b style="color:#e2e8f0">노드 ${graphNodeCount} · 엣지 ${graphEdgeCount}</b>`
      : "") +
    (floorInfoText
      ? `<br><span style="color:#2dd4bf">${floorInfoText}</span>`
      : "") +
    `<br>` +
    (drawing
      ? `<span style="color:#22d3ee;font-weight:bold">● 벽 그리기 중 — 바닥 클릭 = 점 추가 (현재 ${wallPointCount}개, 최소 3개)</span>`
      : `· 로봇 클릭 = 명령 대상 · 노드 클릭 = 목적지 · '선택 노드로 이동 명령'으로 경로 이동`) +
    `<br><span style="color:#475569">엣지 범례: <span style="color:#64748b">■</span> 일반 · <span style="color:#f59e0b">■</span> 특수(roadType) · ▶ 일방통행 방향</span>`;
}
updateHud();

// ─────────────────────────────────────────────────────────
// UI 컨트롤
// ─────────────────────────────────────────────────────────
// ── 컨트롤 패널 (헤더 클릭으로 접기/펼치기) ──
const ui = document.createElement("div");
ui.style.cssText =
  "position:absolute;top:16px;left:16px;z-index:30;display:flex;flex-direction:column;" +
  "background:rgba(15,17,26,0.85);padding:10px 12px;border-radius:8px;" +
  "border:1px solid #334155;color:#fff;font-size:14px;max-width:300px;" +
  "max-height:calc(100vh - 32px);";
container.appendChild(ui);

// 헤더: 클릭 시 본문 토글
const panelHeader = document.createElement("div");
panelHeader.style.cssText =
  "display:flex;align-items:center;justify-content:space-between;gap:12px;" +
  "cursor:pointer;user-select:none;";
panelHeader.addEventListener("mouseenter", () => {
  panelHeader.style.background = "rgba(51,65,85,0.5)";
});
panelHeader.addEventListener("mouseleave", () => {
  panelHeader.style.background = "transparent";
});
ui.appendChild(panelHeader);

const title = document.createElement("div");
title.textContent = "ACS 3D 뷰어 데모";
title.style.cssText = "font-weight:bold;color:#f8fafc;";
panelHeader.appendChild(title);

const panelToggle = document.createElement("div");
panelToggle.textContent = "▾"; // 펼쳐진 상태
panelToggle.style.cssText = "color:#94a3b8;font-size:12px;";
panelHeader.appendChild(panelToggle);

// 본문: 접으면 display:none
const panelBody = document.createElement("div");
panelBody.style.cssText =
  "display:flex;flex-direction:column;gap:8px;margin-top:8px;overflow-y:auto;";
ui.appendChild(panelBody);

let panelOpen = true;
panelHeader.addEventListener("click", () => {
  panelOpen = !panelOpen;
  panelBody.style.display = panelOpen ? "flex" : "none";
  panelToggle.textContent = panelOpen ? "▾" : "▸";
});

function btn(label: string, onClick: () => void, disabled = false) {
  const b = document.createElement("button");
  b.textContent = label;
  b.onclick = onClick;
  b.disabled = disabled;
  b.style.cssText = `padding:8px 14px;border-radius:6px;border:none;background:${disabled ? "#475569" : "#cf211d"
    };color:#fff;cursor:${disabled ? "not-allowed" : "pointer"};font-size:14px;`;
  return b;
}

function sectionLabel(text: string) {
  const el = document.createElement("div");
  el.textContent = text;
  el.style.cssText =
    "font-size:11px;font-weight:bold;color:#64748b;margin-top:6px;text-transform:uppercase;";
  return el;
}

function numberInput(label: string, value: number, min: number, max: number, step: number) {
  const wrap = document.createElement("label");
  wrap.style.cssText = "display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8;";
  const input = document.createElement("input");
  input.type = "number";
  input.value = String(value);
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.style.cssText =
    "width:64px;padding:4px 6px;border-radius:4px;border:1px solid #334155;" +
    "background:#0f172a;color:#e2e8f0;font-size:12px;";
  wrap.appendChild(document.createTextNode(label));
  wrap.appendChild(input);
  return { wrap, input };
}

// ── 지도 섹션 ──
panelBody.appendChild(sectionLabel("지도"));
panelBody.appendChild(btn("지도 이미지 업로드", () => fileInput.click()));

// Axbis 맵 내보내기 폴더 통합 로드 (PGM + YAML + 비즈니스 JSON)
const dirInput = document.createElement("input");
dirInput.type = "file";
dirInput.setAttribute("webkitdirectory", ""); // 폴더 선택
dirInput.style.display = "none";
container.appendChild(dirInput);

panelBody.appendChild(
  btn("Axbis 맵 폴더 로드 (PGM+YAML+JSON)", async () => {
    // 클릭 시점에 파일 선택창이 뜨도록 별도 핸들러 없이 click 트리거
    dirInput.click();
  })
);

dirInput.addEventListener("change", async () => {
  const files = Array.from(dirInput.files ?? []);
  if (files.length === 0) return;
  try {
    const { canvas, meta, graph, floorInfo, pgm } =
      await loadAxbisMapFromFiles(files);

    // 1) PGM → 3D 바닥 텍스처 (YAML resolution/origin 자동 적용)
    viewer.loadMapImage(canvas, meta);

    // 2) 비즈니스 JSON → 노드/엣지 그래프
    if (graph.nodes.length > 0) {
      // 프레임 높이 = 이미지 세로 크기(m) — y원점 "상단" 변환에 사용
      lastFrameHeight =
        floorInfo?.widthM ??
        (meta.heightPx ?? 0) * (meta.resolutionMPerPx ?? 0.05);
      // Axbis 비즈니스 맵 좌표는 항상 "미터" 단위 (셀렉트 값 무관 강제)
      viewer.loadMapGraph(graph, { ...currentGraphOptions(), unit: "m" });
      graphNodeCount = viewer.getGraphNodeCount();
      graphEdgeCount = viewer.getGraphEdgeCount();
      graphVisible = true;
      graphToggleBtn.textContent = "그래프 숨기기";
    }

    // 3) PGM 점유 픽셀 → 벽 자동 생성 (외곽 벽 + 내부 장애물)
    lastPgm = pgm;
    lastMeta = meta;
    autoWallCount = viewer.buildAutoWalls(pgm, meta, { heightM: 2.5 });

    // 3) HUD 층 정보
    floorInfoText = floorInfo
      ? `${floorInfo.name} · ${floorInfo.lengthM}×${floorInfo.widthM}m · v${floorInfo.version}` +
      ` · ${meta.resolutionMPerPx ?? "?"}m/px`
      : `PGM ${meta.widthPx}×${meta.heightPx}px · ${meta.resolutionMPerPx ?? "?"}m/px`;

    // 4) 맵 중심으로 정상단 뷰 이동 — 노드/엣지 확인에 유용
    if (floorInfo) {
      viewer.setTopView(
        floorInfo.lengthM / 2 + (meta.originX ?? 0),
        floorInfo.widthM / 2 + (meta.originY ?? 0),
        Math.max(40, Math.max(floorInfo.lengthM, floorInfo.widthM) * 1.4)
      );
    }
  } catch (err) {
    alert("Axbis 맵 로드 실패: " + (err as Error).message);
  }
  dirInput.value = "";
  updateHud();
});

// ── 벽 섹션 ──
panelBody.appendChild(sectionLabel("벽"));
const { wrap: hWrap, input: heightInput } = numberInput("높이(m)", 3, 0.5, 10, 0.5);
const { wrap: tWrap, input: thicknessInput } = numberInput("두께(m)", 0.2, 0.05, 2, 0.05);
panelBody.appendChild(hWrap);
panelBody.appendChild(tWrap);

const btnStart = btn("벽 그리기 시작", () => {
  viewer.startWallDrawing();
  drawing = true;
  wallPointCount = 0;
  updateHud();
});

const btnClose = btn("루프 닫기 (3D 벽 생성)", () => {
  if (wallPointCount < 3) {
    alert("최소 3개 점을 찍어야 벽을 만들 수 있습니다.");
    return;
  }
  try {
    const height = parseFloat(heightInput.value) || 3;
    const thickness = parseFloat(thicknessInput.value) || 0.2;
    viewer.closeWallLoop({ heightM: height, thicknessM: thickness });
    updateHud();
  } catch (e) {
    alert("벽 생성 실패: " + (e as Error).message);
  }
}, true);

const btnClearPoints = btn("찍은 점 초기화", () => {
  viewer.clearWallPoints();
  wallPointCount = 0;
  btnClose.disabled = true;
  updateHud();
});

const btnStop = btn("그리기 종료", () => {
  viewer.stopWallDrawing();
  viewer.clearWallPoints();
  drawing = false;
  wallPointCount = 0;
  updateHud();
});

const btnDeleteWall = btn("선택한 벽 삭제", () => {
  viewer.removeSelectedWall();
  updateHud();
});

const btnClearWalls = btn("모든 벽 삭제", () => {
  viewer.clearWalls();
  updateHud();
});

const btnAutoDelete = btn("자동 벽 삭제", () => {
  viewer.clearAutoWalls();
  autoWallCount = 0;
  updateHud();
});

const btnAutoRebuild = btn("자동 벽 다시 생성", () => {
  if (!lastPgm || !lastMeta) {
    alert("먼저 'Axbis 맵 폴더 로드'로 PGM 지도를 불러오세요.");
    return;
  }
  autoWallCount = viewer.buildAutoWalls(lastPgm, lastMeta, { heightM: 2.5 });
  updateHud();
});

// 카메라에 가려지는 앞벽 자동 반투명(뷰 의존적 페이드) 토글
const btnFade = btn(`앞벽 자동 페이드: ${viewer.isWallFadeEnabled() ? "ON" : "OFF"}`, () => {
  const next = !viewer.isWallFadeEnabled();
  viewer.setWallFadeEnabled(next);
  btnFade.textContent = `앞벽 자동 페이드: ${next ? "ON" : "OFF"}`;
});

panelBody.appendChild(btnStart);
panelBody.appendChild(btnClose);
panelBody.appendChild(btnClearPoints);
panelBody.appendChild(btnStop);
panelBody.appendChild(btnDeleteWall);
panelBody.appendChild(btnClearWalls);
panelBody.appendChild(btnAutoDelete);
panelBody.appendChild(btnAutoRebuild);
panelBody.appendChild(btnFade);

// ── 로봇 섹션 ──
panelBody.appendChild(sectionLabel("로봇"));
const btnRobotDemo = btn("가상 로봇 데모 시작", () => {
  startRobotDemo();
  btnRobotDemo.textContent = "가상 로봇 데모 실행 중...";
  btnRobotDemo.disabled = true;
});

const btnRobotStop = btn("가상 로봇 정지", () => {
  stopRobotDemo();
  btnRobotDemo.textContent = "가상 로봇 데모 시작";
  btnRobotDemo.disabled = false;
  lastRobotClicked = "";
  updateHud();
});

panelBody.appendChild(btnRobotDemo);
panelBody.appendChild(btnRobotStop);

// 클릭으로 명령: 마지막으로 클릭한 로봇이 마지막으로 클릭한 노드까지 그래프 경로로 이동
panelBody.appendChild(
  btn("선택 노드로 이동 명령", () => {
    if (!lastRobotClicked) {
      alert("먼저 로봇을 클릭해 명령 대상을 선택하세요.");
      return;
    }
    if (!lastNodeClicked) {
      alert("먼저 목적지 노드를 클릭하세요.");
      return;
    }
    if (graphNodeCount === 0) {
      alert("먼저 맵 그래프를 로드하세요 (샘플 그래프 또는 Axbis 맵).");
      return;
    }
    const path = viewer.dispatchRobotToNode(lastRobotClicked, lastNodeClicked, {
      speedMps: 1.2,
    });
    if (!path) {
      alert("경로를 찾을 수 없습니다.");
      return;
    }
    const v = vrobots.find((r) => r.id === lastRobotClicked);
    if (v) v.dispatched = true; // 도착할 때까지 틱 중지
    arrivedInfo = "";
    updateHud();
  })
);

// ── 맵 그래프 (노드/엣지) 섹션 ──
panelBody.appendChild(sectionLabel("맵 그래프 (노드/엣지)"));

// 좌표 단위 선택 + y 원점 옵션 (노드가 맵 기준 상하 반전으로 보이면 "상단" 선택)
const graphOptsRow = document.createElement("div");
graphOptsRow.style.cssText = "display:flex;align-items:center;gap:8px;font-size:12px;color:#94a3b8;";
const unitSelect = document.createElement("select");
unitSelect.style.cssText =
  "padding:4px 6px;border-radius:4px;border:1px solid #334155;background:#0f172a;color:#e2e8f0;font-size:12px;";
unitSelect.innerHTML = `<option value="mm">좌표 단위: mm</option><option value="m">좌표 단위: m</option>`;
const yOriginSelect = document.createElement("select");
yOriginSelect.style.cssText = unitSelect.style.cssText;
yOriginSelect.innerHTML =
  `<option value="top">y 원점: 상단(이미지)</option>` +
  `<option value="bottom">y 원점: 하단(ROS)</option>`;
graphOptsRow.appendChild(unitSelect);
graphOptsRow.appendChild(yOriginSelect);
panelBody.appendChild(graphOptsRow);

/** 마지막으로 로드한 맵의 프레임 높이(m) — y원점 "상단" 변환에 사용 */
let lastFrameHeight: number | undefined;

function currentGraphOptions() {
  const yOrigin = yOriginSelect.value as "top" | "bottom";
  return {
    unit: unitSelect.value as "mm" | "m",
    showLabels: true,
    yOrigin,
    ...(yOrigin === "top" && lastFrameHeight != null
      ? { frameHeight: lastFrameHeight }
      : {}),
  };
}

// 샘플 창고 그리드 그래프 생성 (데모룸 맵 JSON 규격과 동일 구조)
function makeSampleGraph(): MapGraphData {
  const nodes: MapGraphNode[] = [];
  const edges: MapGraphEdge[] = [];
  const cols = 6;
  const rows = 4;
  const gap = 6000; // mm
  const at = (r: number, c: number) => `N-${r}${c}`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      nodes.push({
        nodeId: at(r, c),
        nodePosition: {
          x: (c - (cols - 1) / 2) * gap,
          y: (r - (rows - 1) / 2) * gap,
        },
        kind:
          r === 0 && (c === 0 || c === cols - 1)
            ? "charge"
            : c === 0
              ? "rack"
              : "normal",
      });
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c < cols - 1) {
        edges.push({ edgeId: `${at(r, c)}-${at(r, c + 1)}`, startNodeId: at(r, c), endNodeId: at(r, c + 1) });
      }
      if (r < rows - 1) {
        edges.push({ edgeId: `${at(r, c)}-${at(r + 1, c)}`, startNodeId: at(r, c), endNodeId: at(r + 1, c) });
      }
    }
  }
  return { mapId: "sample", mapName: "샘플 창고 그리드", nodes, edges };
}

let graphVisible = true;
const graphToggleBtn = btn("그래프 숨기기", () => {
  graphVisible = !graphVisible;
  viewer.setGraphVisible(graphVisible);
  graphToggleBtn.textContent = graphVisible ? "그래프 숨기기" : "그래프 보이기";
});

panelBody.appendChild(
  btn("샘플 그래프 로드", () => {
    const graph = makeSampleGraph();
    viewer.loadMapGraph(graph, currentGraphOptions());
    graphNodeCount = viewer.getGraphNodeCount();
    graphEdgeCount = viewer.getGraphEdgeCount();
    graphVisible = true;
    graphToggleBtn.textContent = "그래프 숨기기";
    updateHud();
  })
);

const graphInput = document.createElement("input");
graphInput.type = "file";
graphInput.accept = ".json";
graphInput.style.display = "none";
container.appendChild(graphInput);

panelBody.appendChild(
  btn("그래프 JSON 로드", () => graphInput.click())
);

graphInput.addEventListener("change", async () => {
  const file = graphInput.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text()) as MapGraphData;
    viewer.loadMapGraph(data, currentGraphOptions());
    graphNodeCount = viewer.getGraphNodeCount();
    graphEdgeCount = viewer.getGraphEdgeCount();
    graphVisible = true;
    graphToggleBtn.textContent = "그래프 숨기기";
    updateHud();
  } catch (err) {
    alert("그래프 로드 실패: " + (err as Error).message);
  }
  graphInput.value = "";
});

panelBody.appendChild(
  btn("경로 하이라이트 데모", () => {
    viewer.highlightGraphNodes(["N-00", "N-01", "N-02", "N-03"]);
    viewer.highlightGraphEdges(["N-00-N-01", "N-01-N-02", "N-02-N-03"]);
  })
);

panelBody.appendChild(btn("하이라이트 해제", () => viewer.clearGraphHighlights()));
panelBody.appendChild(graphToggleBtn);

// ── 카메라 섹션 ──
panelBody.appendChild(sectionLabel("카메라"));
panelBody.appendChild(btn("위에서 보기 (Top View)", () => viewer.setTopView()));

// ─────────────────────────────────────────────────────────
// 가상 로봇 데모 (100ms 간격 좌표 송신 → RobotManager가 Lerp 보간)
// ─────────────────────────────────────────────────────────
interface VRobot {
  id: string;
  status: string;
  waypoints: { x: number; z: number }[];
  idx: number;
  t: number;
  speed: number;
  dispatched?: boolean; // 경로 이동 명령 중 → 틱 중지 (시뮬레이션 간섭 방지)
}

const vrobots: VRobot[] = [
  {
    id: "AGV-01",
    status: "running",
    waypoints: [
      { x: -15, z: -8 },
      { x: 15, z: -8 },
      { x: 15, z: 8 },
      { x: -15, z: 8 },
    ],
    idx: 0,
    t: 0,
    speed: 0.15,
  },
  {
    id: "AGV-02",
    status: "charging",
    waypoints: [
      { x: -18, z: 0 },
      { x: 18, z: 0 },
    ],
    idx: 0,
    t: 0,
    speed: 0.1,
  },
  {
    id: "AMR-03",
    status: "error",
    waypoints: [
      { x: 0, z: -10 },
      { x: 0, z: 10 },
    ],
    idx: 0,
    t: 0,
    speed: 0.08,
  },
];

let demoTimer: number | null = null;

function tickVRobots() {
  for (const r of vrobots) {
    if (r.dispatched) continue; // 경로 이동 중인 로봇은 틱 중지
    const a = r.waypoints[r.idx];
    const b = r.waypoints[(r.idx + 1) % r.waypoints.length];
    r.t += r.speed * 0.1; // 100ms 틱
    if (r.t >= 1) {
      r.t = 0;
      r.idx = (r.idx + 1) % r.waypoints.length;
    }
    const x = a.x + (b.x - a.x) * r.t;
    const z = a.z + (b.z - a.z) * r.t;
    viewer.updateRobotPose({ id: r.id, x, y: z, status: r.status });
  }
}

function startRobotDemo() {
  if (demoTimer !== null) return;
  demoTimer = window.setInterval(tickVRobots, 100);
}

function stopRobotDemo() {
  if (demoTimer !== null) {
    clearInterval(demoTimer);
    demoTimer = null;
  }
  viewer.clearRobots();
}

// ─────────────────────────────────────────────────────────
// 뷰어 이벤트
// ─────────────────────────────────────────────────────────
viewer.onWallPointAdded(() => {
  wallPointCount++;
  btnClose.disabled = wallPointCount < 3;
  updateHud();
});

viewer.onWallCreated(() => {
  wallPointCount = 0;
  btnClose.disabled = true;
  updateHud();
});

viewer.onWallSelected((wallId) => {
  if (wallId) console.log(`[AcsViewer] 벽 선택: ${wallId}`);
  updateHud();
});

viewer.onRobotClick((robotId) => {
  lastRobotClicked = robotId;
  console.log(`[AcsViewer] 로봇 클릭: ${robotId}`);
  updateHud();
});

viewer.onNodeClick((nodeId) => {
  lastNodeClicked = nodeId;
  console.log(`[AcsViewer] 노드 클릭: ${nodeId}`);
  updateHud();
});

viewer.onEdgeClick((edge) => {
  if (edge) {
    const parts = [edge.edgeId ?? "-", `${edge.startNodeId}→${edge.endNodeId}`];
    if (edge.maxVelocity != null) parts.push(`최대 ${edge.maxVelocity}m/s`);
    if (edge.roadType) parts.push(`roadType ${edge.roadType}`);
    if (edge.edgeLengthM != null) parts.push(`${edge.edgeLengthM}m`);
    lastEdgeInfo = parts.join(" · ");
    console.log(`[AcsViewer] 엣지 클릭:`, edge);
  } else {
    lastEdgeInfo = "";
  }
  updateHud();
});

viewer.onRobotArrived((robotId) => {
  // 경로 이동 완료 → 가상 로봇 틱 재개
  const v = vrobots.find((r) => r.id === robotId);
  if (v) v.dispatched = false;
  arrivedInfo = robotId;
  console.log(`[AcsViewer] 목적지 도착: ${robotId}`);
  updateHud();
});

console.log("[AcsViewer] 벽 + 로봇 + 맵 그래프 데모 시작");
