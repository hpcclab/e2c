import React from "react";
import Task from "./Task";

export default function TaskPalette({
  batchQ,
  setSelectedTask,
  onTaskDragStart,
  title = "Tasks",
}) {
  const tasks = (batchQ.queue || []).map((t) => ({
    ...t,
    id: t.id != null ? t.id : t.taskId,
  }));

  return (
    <div className="w-48 border-r border-gray-400 bg-[#f5f5f5] p-3 flex flex-col gap-3 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      {tasks.length === 0 && (
        <div className="text-xs text-gray-500 italic">No tasks loaded</div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {tasks.map((task, idx) => (
          <div key={task.id ?? idx} className="h-10">
            <Task
              task={task}
              setSelectedTask={setSelectedTask}
              draggable
              onDragStart={() =>
                onTaskDragStart && onTaskDragStart(task, idx, batchQ.id)
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
