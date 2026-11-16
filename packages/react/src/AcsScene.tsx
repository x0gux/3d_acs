import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from "react";
import {
  AcsViewer,
  type AcsViewerOptions,
  type MapGraphData,
  type MapGraphEdge,
  type MapGraphOptions,
  type MapMeta,
  type RobotPose,
} from "@axbis/acs-core";

export interface AcsSceneProps {
  /**
   * 뷰어 옵션 — 마운트 시 1회 적용 (변경해도 뷰어가 재생성되지 않음)
   * 실행 중 설정 변경은 ref로 얻은 viewer 인스턴스의 메서드를 사용하세요.
   */
  options?: AcsViewerOptions;
  className?: string;
  style?: CSSProperties;
  /**
   * 로봇 좌표 목록 — 값이 변경될 때마다 updateRobotPose로 전달됩니다.
   * 자주 갱신하는 경우 배열 참조를 안정적으로 유지하거나,
   * ref의 getViewer()로 직접 전달하는 것을 권장합니다.
   */
  poses?: RobotPose[];
  /**
   * poses 전달 시 진행 중인 시뮬레이션 경로 중단 여부 (기본 true — 실측 좌표 우선).
   * 시뮬레이션 틱으로 로봇을 움직일 때는 false를 넘기세요.
   */
  interruptPath?: boolean;
  onRobotClick?: (robotId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edge: MapGraphEdge) => void;
  onWallSelected?: (wallId: string | null) => void;
  onWallCreated?: (wallId: string, mesh: unknown) => void;
  onRobotArrived?: (robotId: string) => void;
}

/**
 * AcsScene ref로 노출되는 imperative 핸들.
 * getViewer()로 코어 AcsViewer 전체 API에 접근할 수 있습니다.
 */
export interface AcsSceneHandle {
  getViewer(): AcsViewer | null;
  loadMapImage(
    src: string | HTMLImageElement | HTMLCanvasElement,
    meta?: MapMeta
  ): void;
  loadMapGraph(graph: MapGraphData, options?: MapGraphOptions): void;
  dispatchRobotToNode(
    robotId: string,
    targetNodeId: string,
    options?: { speedMps?: number }
  ): string[] | null;
  setTopView(centerX?: number, centerZ?: number, height?: number): void;
}

/**
 * ACS 관제 3D 뷰어 React 컴포넌트.
 *
 * 사용 예:
 * ```tsx
 * const ref = useRef<AcsSceneHandle>(null);
 * <AcsScene
 *   ref={ref}
 *   poses={robotPoses}
 *   onNodeClick={(id) => ref.current?.getViewer()?.dispatchRobotToNode("AGV-01", id)}
 * />
 * ```
 *
 * 주의: 부모 컨테이너에 높이가 있어야 합니다 (기본 width/height 100%).
 */
export const AcsScene = forwardRef<AcsSceneHandle, AcsSceneProps>(
  function AcsScene(props, ref) {
    const {
      options,
      className,
      style,
      poses,
      interruptPath = true,
      onRobotClick,
      onNodeClick,
      onEdgeClick,
      onWallSelected,
      onWallCreated,
      onRobotArrived,
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<AcsViewer | null>(null);

    // 최신 콜백 유지 — 구독은 마운트 시 1회만 수행
    const cbs = useRef({
      onRobotClick,
      onNodeClick,
      onEdgeClick,
      onWallSelected,
      onWallCreated,
      onRobotArrived,
    });
    cbs.current = {
      onRobotClick,
      onNodeClick,
      onEdgeClick,
      onWallSelected,
      onWallCreated,
      onRobotArrived,
    };

    useEffect(() => {
      if (!containerRef.current) return;
      const viewer = new AcsViewer(containerRef.current, options ?? {});
      viewerRef.current = viewer;

      viewer.onRobotClick((id) => cbs.current.onRobotClick?.(id));
      viewer.onNodeClick((id) => cbs.current.onNodeClick?.(id));
      viewer.onEdgeClick((edge) => cbs.current.onEdgeClick?.(edge));
      viewer.onWallSelected((id) => cbs.current.onWallSelected?.(id));
      viewer.onWallCreated((id, mesh) => cbs.current.onWallCreated?.(id, mesh));
      viewer.onRobotArrived((id) => cbs.current.onRobotArrived?.(id));

      return () => {
        viewer.dispose();
        viewerRef.current = null;
      };
      // options는 마운트 시 1회만 반영
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // poses → 코어 전달
    useEffect(() => {
      if (!poses) return;
      for (const pose of poses) {
        viewerRef.current?.updateRobotPose(pose, { interruptPath });
      }
    }, [poses, interruptPath]);

    useImperativeHandle(
      ref,
      () => ({
        getViewer: () => viewerRef.current,
        loadMapImage: (src, meta) => {
          viewerRef.current?.loadMapImage(src, meta);
        },
        loadMapGraph: (graph, o) => {
          viewerRef.current?.loadMapGraph(graph, o);
        },
        dispatchRobotToNode: (robotId, targetNodeId, o) => {
          return viewerRef.current?.dispatchRobotToNode(robotId, targetNodeId, o) ?? null;
        },
        setTopView: (centerX, centerZ, height) => {
          viewerRef.current?.setTopView(centerX, centerZ, height);
        },
      }),
      []
    );

    return (
      <div
        ref={containerRef}
        className={className}
        style={{ width: "100%", height: "100%", ...style }}
      />
    );
  }
);

export default AcsScene;
