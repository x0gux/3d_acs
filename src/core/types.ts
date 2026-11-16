export interface RobotPose {
  id: string;
  x: number; // 월드 X (m)
  y: number; // 월드 Z (m) — Three.js Z축과 동일하게 전달
  theta?: number; // 회전각 (도). 생략 시 이동 방향으로 자동 회전
  status: string; // running | idle | charging | error ...
}

export interface AcsViewerOptions {
  width?: number;
  height?: number;
  backgroundColor?: number;
  fogNear?: number;
  fogFar?: number;
  /** 카메라에 가려지는 앞쪽 벽 자동 반투명(페이드) 설정 */
  wallFade?: Partial<WallFadeOptions>;
}

/**
 * 뷰 의존적 벽 페이드 설정
 *
 * 카메라가 어떤 벽 세그먼트의 "바깥쪽"(루프 내부 반대편)에 있고,
 * 시선 각도가 낮을수록(수평에 가까울수록) 그 벽을 반투명하게 만들어
 * 내부 로봇/경로가 보이도록 한다. 위에서 내려다보면(탑뷰) 불투명 유지.
 *
 * 판정값 s = normalize(카메라위치 - 벽중점) · 벽바깥법선 (코사인, -1~1)
 * - s=0 : 카메라가 벽 바로 위(수직) → 불투명
 * - s=1 : 카메라가 벽 정면 수평 방향 → 가장 투명
 * - s<0 : 카메라가 벽 안쪽(반대편) → 불투명
 */
export interface WallFadeOptions {
  enabled: boolean;
  /** 최대로 투명해질 때의 opacity (0~1, 기본 0.15) */
  minOpacity: number;
  /** 페이드 시작 임계값 (cos 값, 기본 0.45 — 카메라 고도 약 27° 이하부터 서서히) */
  fadeStart: number;
  /** 완전 페이드 임계값 (cos 값, 기본 0.85 — 고도 약 58°에서 최대 투명도) */
  fadeEnd: number;
  /** 초당 투명도 보간 속도 (기본 8, 클수록 빠르게 전환) */
  fadeSpeed: number;
}

/** 맵 캘리브레이션: 이미지 해상도(px)와 실제 크기(m)의 비율 계산용 */
export interface MapCalibration {
  imageWidthPx: number;   // 업로드된 맵 이미지 너비 (px)
  imageHeightPx: number;  // 업로드된 맵 이미지 높이 (px)
  realWidthM: number;     // 실제 맵 너비 (미터)
  realHeightM: number;    // 실제 맵 높이 (미터)
  originX?: number;       // 월드 원점 오프셋 X (이미지 좌하단 기준)
  originY?: number;       // 월드 원점 오프셋 Y
  resolutionMPerPx?: number; // 미터/픽셀 (ROS map_server 규약)
}

/** 지도 메타데이터 (ROS map_server YAML / Axbis 맵 공통) */
export interface MapMeta {
  image?: string;            // 참조된 이미지 경로 (YAML의 image 키)
  resolutionMPerPx?: number; // 미터/픽셀
  originX?: number;          // 이미지 좌하단의 월드 X
  originY?: number;          // 이미지 좌하단의 월드 Y
  negate?: boolean;          // 점유 해석 반전
  occupiedThresh?: number;   // 점유 임계값 (0~1, 기본 0.65)
  freeThresh?: number;       // 자유 임계값 (0~1, 기본 0.196)
  widthPx?: number;          // 이미지 너비 (px)
  heightPx?: number;         // 이미지 높이 (px)
}

export interface WallPoint {
  x: number; // 캔버스/이미지 기준 X (px)
  y: number; // 캔버스/이미지 기준 Y (px)
}

/** Three.js 월드 좌표 (바닥면 X-Z 평면, 미터) */
export interface WorldPoint {
  x: number;
  z: number;
}

export interface WallOptions {
  heightM: number;    // 벽 높이 (m), 기본 3.0
  thicknessM: number; // 벽 두께 (m), 기본 0.15
  color?: number;     // 벽 색상 (0xRRGGBB)
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
  kind?: string; // charge | rack | container | normal | function
  externalCode?: string | null;
}

export interface MapGraphEdge {
  edgeId?: string;
  startNodeId: string;
  endNodeId: string;
  roadType?: string;      // 특수 도로 타입 (비어있으면 일반)
  maxVelocity?: number;   // 최대 속도 (m/s)
  orientation?: string;   // 허용 주행 각도 목록 ("0,180,90,-90")
  edgeLengthM?: number;   // 엣지 길이 (m)
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
  /**
   * 노드 y 원점 기준.
   * - "bottom"(기본): y 증가 = +Z (ROS 북쪽 규약)
   * - "top": y 증가 = −Z (이미지/화면 상단 기준, 아래로 증가)
   *   → z = frameHeight − y 로 변환 (frameHeight 미지정 시 단순 부호 반전)
   */
  yOrigin?: "bottom" | "top";
  /**
   * yOrigin="top"일 때 변환 기준이 되는 프레임 전체 높이.
   * 단위는 unit과 동일 (Axbis 맵: floorWidth 값). 지정하면 반전+오프셋이 정확히 적용됩니다.
   */
  frameHeight?: number;
  /** 노드 ID 라벨 표시 (기본 true) */
  showLabels?: boolean;
  /** 노드 마커 반지름 (m, 기본 0.4) */
  nodeSize?: number;
  /** 일방통행 엣지 방향 화살표 표시 (기본 true) */
  showArrows?: boolean;
}
