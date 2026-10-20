import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useGlobalState } from "../context/GlobalStates";
import { getTaskColor } from "../utils/taskColors";

const VISIBLE_QUEUE_SLOTS = 3;

const LBNode = memo(function LBNode({ id, isConnectable }) {
  const {
    setSidebarMode,
    setShowSidebar,
    setSubmissionStatus,
    loadBalancerRef,
    setNodes,
    schedulingMode,
    unassignedTasks,
    iot,
  } = useGlobalState();
  const periodic = schedulingMode === "batch";
  const queuedTasks = periodic
    ? unassignedTasks.filter((task) => task.status === "WAITING_FOR_BATCH")
    : [];
  const visibleTasks = queuedTasks.slice(0, VISIBLE_QUEUE_SLOTS);
  const hiddenTaskCount = Math.max(0, queuedTasks.length - visibleTasks.length);

  const taskColor = (task) => {
    const source = iot.find(
      (candidate) => String(candidate.id) === String(task.source_id),
    );
    return getTaskColor(source?.properties?.taskColor);
  };
  const openSidebar = (mode) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        selected: node.id === id,
      })),
    );
    setSidebarMode(mode);
    setShowSidebar(true);
    setSubmissionStatus(""); // Reset submission status when opening the sidebar
  };
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      />
      <div className={periodic ? "flex items-center gap-2" : undefined}>
        {periodic && (
          <div
            onClick={() => openSidebar("loadBalancer")}
            className="nodrag w-32 rounded-lg border-2 border-blue-400 bg-white p-2 text-gray-800 shadow-md"
            title={`${queuedTasks.length} task${queuedTasks.length === 1 ? "" : "s"} waiting for the next periodic batch`}
          >
            <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide text-blue-800">
              <span>Batch queue</span>
              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-blue-700">
                {queuedTasks.length}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: VISIBLE_QUEUE_SLOTS }, (_, index) => {
                const task = visibleTasks[index];
                if (!task) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="h-8 min-w-0 flex-1 rounded border border-gray-300 bg-gray-100"
                      aria-hidden="true"
                    />
                  );
                }
                const color = taskColor(task);
                const taskId = task.taskId ?? task.id ?? index + 1;
                return (
                  <div
                    key={`${task.source_id}-${taskId}-${index}`}
                    className="flex h-8 min-w-0 flex-1 items-center justify-center rounded border text-[9px] font-bold"
                    style={{
                      backgroundColor: color.bg,
                      borderColor: color.accent,
                      color: color.text,
                    }}
                    title={`Task ${taskId}: ${task.task_type}`}
                  >
                    {taskId}
                  </div>
                );
              })}
            </div>
            {hiddenTaskCount > 0 && (
              <p className="mt-1 text-center text-[10px] font-semibold text-gray-600">
                +{hiddenTaskCount} more
              </p>
            )}
          </div>
        )}
        {/* Load Balancer Button */}
        <div
          ref={loadBalancerRef}
          onClick={() => openSidebar("loadBalancer")}
          className="bg-gray-800 text-white text-lg font-semibold w-25 h-25 flex items-center justify-center rounded-full cursor-pointer hover:scale-110 transition text-center px-2"
        >
          Load
          <br />
          Balancer
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </>
  );
});

export default LBNode;
