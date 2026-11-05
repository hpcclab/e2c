import React, { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { useGlobalState } from "../context/GlobalStates";
import { getTaskColor } from "../utils/taskColors";
import { getLoadBalancerDisplayName } from "../utils/loadBalancers";

const VISIBLE_QUEUE_SLOTS = 3;

const LBNode = memo(function LBNode({ id, data, isConnectable }) {
  const [queueExpanded, setQueueExpanded] = useState(false);
  const {
    setSidebarMode,
    setShowSidebar,
    setSubmissionStatus,
    setNodes,
    schedulingMode,
    unassignedTasks,
    iot,
  } = useGlobalState();
  const periodic = (data?.schedulingMode ?? schedulingMode) === "batch";
  const queuedTasks = periodic
    ? unassignedTasks.filter(
        (task) =>
          task.status === "WAITING_FOR_BATCH" &&
          String(task.load_balancer_id ?? "") === String(id),
      )
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
          <div className="nodrag nopan nowheel relative w-32">
            <button
              type="button"
              aria-expanded={queueExpanded}
              aria-controls={`load-balancer-queue-${id}`}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setQueueExpanded((expanded) => !expanded);
              }}
              className="w-full cursor-pointer rounded-lg border-2 border-blue-400 bg-white p-2 text-left text-gray-800 shadow-md transition hover:border-blue-600 hover:bg-blue-50"
              title={`${queuedTasks.length} task${queuedTasks.length === 1 ? "" : "s"} waiting for the next periodic batch. Click to ${queueExpanded ? "hide" : "show"} all tasks.`}
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide text-blue-800">
                <span>Batch queue</span>
                <span className="flex items-center gap-1">
                  <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-blue-700">
                    {queuedTasks.length}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`text-xs transition-transform ${queueExpanded ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
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
            </button>

            {queueExpanded && (
              <div
                id={`load-balancer-queue-${id}`}
                role="region"
                aria-label="Tasks waiting in the batch queue"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                className="absolute left-0 top-full z-50 mt-2 max-h-72 w-64 overflow-y-auto rounded-lg border border-blue-200 bg-white p-2 shadow-xl"
              >
                <div className="sticky top-0 z-10 mb-1 flex items-center justify-between border-b border-gray-200 bg-white pb-2 text-xs font-bold text-gray-800">
                  <span>Waiting tasks</span>
                  <span>{queuedTasks.length}</span>
                </div>
                {queuedTasks.length === 0 ? (
                  <p className="py-3 text-center text-xs text-gray-500">
                    No tasks are waiting for the next batch.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {queuedTasks.map((task, index) => {
                      const color = taskColor(task);
                      const taskId = task.taskId ?? task.id ?? index + 1;
                      const arrivalTime = Number(task.arrival_time);

                      return (
                        <div
                          key={`${task.source_id}-${taskId}-${index}-expanded`}
                          className="flex items-center gap-2 rounded border px-2 py-1.5 text-xs"
                          style={{
                            backgroundColor: color.bg,
                            borderColor: color.accent,
                            color: color.text,
                          }}
                        >
                          <span className="min-w-0 flex-1 truncate font-bold">
                            Task {taskId}
                          </span>
                          <span className="max-w-24 truncate" title={task.task_type}>
                            {task.task_type}
                          </span>
                          {Number.isFinite(arrivalTime) && (
                            <span className="whitespace-nowrap opacity-75">
                              {arrivalTime.toFixed(3)}s
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* Load Balancer Button */}
        <div
          onClick={() => openSidebar("loadBalancer")}
          className="bg-gray-800 text-white text-lg font-semibold w-25 h-25 flex items-center justify-center rounded-full cursor-pointer hover:scale-110 transition text-center px-2"
        >
          <span className="leading-tight">
            {getLoadBalancerDisplayName(id, data)}
          </span>
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
