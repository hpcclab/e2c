import { useState, useEffect } from "react";

const PALETTE = [
  { name: "Slate", bg: "#334155", text: "#e2e8f0", accent: "#94a3b8" },
  { name: "Sky", bg: "#0369a1", text: "#e0f2fe", accent: "#7dd3fc" },
  { name: "Teal", bg: "#0f766e", text: "#ccfbf1", accent: "#5eead4" },
  { name: "Emerald", bg: "#166534", text: "#dcfce7", accent: "#86efac" },
  { name: "Violet", bg: "#5b21b6", text: "#ede9fe", accent: "#c4b5fd" },
  { name: "Rose", bg: "#9f1239", text: "#ffe4e6", accent: "#fda4af" },
  { name: "Amber", bg: "#92400e", text: "#fef3c7", accent: "#fcd34d" },
  { name: "Fuchsia", bg: "#86198f", text: "#fae8ff", accent: "#e879f9" },
];

// Shared registry: task_type -> palette index
// EditIoTProperties writes here; Task reads from here.
export const colorMemory = {};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@500&display=swap');

  .task-root {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 5px;
    overflow: visible;
  }
  .task-body {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 40px;
    border-radius: 5px;
    padding: 0 6px;
    cursor: pointer;
    transition: filter 0.15s, transform 0.15s;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
  }
  .task-body::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--task-accent);
    border-radius: 5px 0 0 5px;
  }
  .task-body:hover {
    filter: brightness(1.18);
    transform: scaleY(1.06);
  }
  .task-id {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.03em;
    color: var(--task-text);
    line-height: 1;
    padding-left: 4px;
  }
`;

export default function Task({ task, setSelectedTask }) {
  const details = {
    id: String(task.id),
    task_type: String(task.task_type),
    assigned_machine: String(task.assigned_machine),
    data_size: String(task.data_size),
    arrival_time: String(task.arrival_time),
    deadline: String(task.deadline),
    start_time: String(task.start_time),
    end_time: String(task.end_time),
    missed_time: String(task.missed_time),
    status: String(task.status),
  };

  // Re-render when any IoT updates a task_type color
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const handler = () => forceUpdate((n) => n + 1);
    window.addEventListener("taskColorChanged", handler);
    return () => window.removeEventListener("taskColorChanged", handler);
  }, []);

  if (!(task.id >= 0)) return null;

  const idx = colorMemory[details.task_type] ?? 0;
  const color = PALETTE[idx];

  return (
    <>
      <style>{STYLES}</style>
      <div className="task-root">
        <div
          className="task-body"
          style={{
            background: color.bg,
            "--task-text": color.text,
            "--task-accent": color.accent,
          }}
          onClick={() => setSelectedTask(details)}
          title={`Task ${details.id} · ${details.task_type}`}
        >
          <span className="task-id">{details.id}</span>
        </div>
      </div>
    </>
  );
}
