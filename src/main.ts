import { AcsViewer } from "./core/AcsViewer";
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

const hud = document.createElement("div");
hud.style.cssText =
  "position:absolute;bottom:16px;left:16px;z-index:30;color:#94a3b8;" +
  "font-size:12px;line-height:1.8;pointer-events:none;";
container.appendChild(hud);

let wallPointCount = 0;

function updateHud() {
  hud.innerHTML =
    `<b style="color:#e2e8f0">조작</b> · 좌클릭 드래그: 회전 · 우클릭 드래그: 이동 · 휠: 줌<br>` +
    `생성된 벽: <b style="color:#e2e8f0">${viewer.getWallCount()}</b>개` +
    (lastRobotClicked
      ? ` · 마지막 클릭 로봇: <b style="color:#22d3ee">${lastRobotClicked}</b>`
      : "") +
    `<br>` +
    (drawing
      ? `<span style="color:#22d3ee;font-weight:bold">● 벽 그리기 중 — 바닥 클릭 = 점 추가 (현재 ${wallPointCount}개, 최소 3개)</span>`
      : `· '벽 그리기 시작' 후 바닥을 클릭해 외곽선을 그리세요 · 로봇/벽 클릭 시 선택`);
}
updateHud();

// ─────────────────────────────────────────────────────────
// UI 컨트롤
// ─────────────────────────────────────────────────────────
const ui = document.createElement("div");
ui.style.cssText =
  "position:absolute;top:16px;left:16px;z-index:30;display:flex;flex-direction:column;" +
  "gap:8px;background:rgba(15,17,26,0.85);padding:12px;border-radius:8px;" +
  "border:1px solid #334155;color:#fff;font-size:14px;max-height:calc(100vh - 32px);" +
  "overflow-y:auto;";
container.appendChild(ui);

const title = document.createElement("div");
title.textContent = "ACS 3D 뷰어 데모";
title.style.fontWeight = "bold";
title.style.marginBottom = "4px";
title.style.color = "#f8fafc";
ui.appendChild(title);

function btn(label: string, onClick: () => void, disabled = false) {
  const b = document.createElement("button");
  b.textContent = label;
  b.onclick = onClick;
  b.disabled = disabled;
  b.style.cssText = `padding:8px 14px;border-radius:6px;border:none;background:${
    disabled ? "#475569" : "#cf211d"
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
ui.appendChild(sectionLabel("지도"));
ui.appendChild(btn("지도 이미지 업로드", () => fileInput.click()));

// ── 벽 섹션 ──
ui.appendChild(sectionLabel("벽"));
const { wrap: hWrap, input: heightInput } = numberInput("높이(m)", 3, 0.5, 10, 0.5);
const { wrap: tWrap, input: thicknessInput } = numberInput("두께(m)", 0.2, 0.05, 2, 0.05);
ui.appendChild(hWrap);
ui.appendChild(tWrap);

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

ui.appendChild(btnStart);
ui.appendChild(btnClose);
ui.appendChild(btnClearPoints);
ui.appendChild(btnStop);
ui.appendChild(btnDeleteWall);
ui.appendChild(btnClearWalls);

// ── 로봇 섹션 ──
ui.appendChild(sectionLabel("로봇"));
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

ui.appendChild(btnRobotDemo);
ui.appendChild(btnRobotStop);

// ── 카메라 섹션 ──
ui.appendChild(sectionLabel("카메라"));
ui.appendChild(btn("위에서 보기 (Top View)", () => viewer.setTopView()));

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

console.log("[AcsViewer] 벽 + 로봇 데모 시작");
