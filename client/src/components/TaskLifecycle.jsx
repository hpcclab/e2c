import React, { useState, useEffect } from 'react';

function buildStages(task) {
  const stages = [
    {
      label: 'Arrived',
      time: task.arrival_time,
      status: 'NEW',
      detail: `Task ${task.taskId ?? task.id} (${task.task_type}) entered the system`,
    },
  ];

  if (task.start != null) {
    stages.push({
      label: 'Executing',
      time: task.start,
      status: 'MAPPED',
      detail: `Assigned to ${task.assigned_machine ?? 'unknown machine'} — exec time: ${task.execution_time?.toFixed(3) ?? '?'}s`,
    });
  }

  if (task.end != null) {
    const isUnassigned = task.machineId === null;
    const finalStatus = isUnassigned ? 'UNASSIGNED' : task.status;
    const deadlineNote =
      task.deadline > 0
        ? `  |  Deadline: ${task.deadline?.toFixed(3)}`
        : '';
    stages.push({
      label: finalStatus,
      time: task.end,
      status: finalStatus,
      detail: `Finished at ${task.end?.toFixed(3)}${deadlineNote}`,
    });
  }

  return stages;
}

const statusColors = {
  NEW: 'bg-blue-100 text-blue-800',
  MAPPED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  DEADLINE_MISSED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-orange-100 text-orange-600',
  UNASSIGNED: 'bg-amber-100 text-amber-800',
};

const pillColors = {
  NEW: 'bg-blue-500',
  MAPPED: 'bg-purple-500',
  COMPLETED: 'bg-green-500',
  DEADLINE_MISSED: 'bg-red-500',
  CANCELLED: 'bg-orange-500',
  UNASSIGNED: 'bg-amber-500',
};

export default function TaskLifecycle({ task }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  // Reset to first stage when task changes
  useEffect(() => {
    setCurrentIdx(0);
  }, [task?.taskId ?? task?.id]);

  if (!task) return null;

  const stages = buildStages(task);
  const current = stages[currentIdx];
  const badgeClass = statusColors[current.status] ?? 'bg-gray-100 text-gray-800';
  const pillClass = pillColors[current.status] ?? 'bg-gray-400';

  return (
    <div className="border-t border-gray-200 pt-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-700">
          Task {task.taskId ?? task.id} — Lifecycle
        </span>
        <span className="text-xs text-gray-400">{currentIdx + 1} / {stages.length}</span>
      </div>

      {/* Stage pills */}
      <div className="flex items-center gap-1 mb-4">
        {stages.map((stage, i) => (
          <React.Fragment key={i}>
            <button
              onClick={() => setCurrentIdx(i)}
              className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
                i === currentIdx
                  ? `${pillClass} text-white shadow`
                  : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
              }`}
            >
              {stage.label}
            </button>
            {i < stages.length - 1 && (
              <div className="flex-1 h-px bg-gray-300 min-w-[12px]" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current stage detail */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>
            {current.status}
          </span>
          <span className="text-gray-500 font-mono">t = {current.time?.toFixed(3) ?? '?'}</span>
        </div>
        <p className="text-gray-600">{current.detail}</p>
      </div>

      {/* Prev / Next */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => setCurrentIdx(i => i - 1)}
          disabled={currentIdx === 0}
          className="px-3 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <button
          onClick={() => setCurrentIdx(i => i + 1)}
          disabled={currentIdx === stages.length - 1}
          className="px-3 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
