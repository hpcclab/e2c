import { useState, useRef, useEffect } from "react";

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

// Persist color choices across renders by task id
const colorMemory = {};

export default function Task({ task, setSelectedTask }) {
  const details = {
    id: String(task.id),
    task_type: String(task.task_type),
    assigned_machine: String(task.assigned_machine),
    data_size: String(task.data_size),
    arrival_time: String(task.arrival_time),
    deadline: String(task.deadline),
    start: String(task.start),
    end: String(task.end),
    status: String(task.status),
  };

  const [colorIdx, setColorIdx] = useState(() => colorMemory[details.id] ?? 0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  const btnRef = useRef(null);

  const color = PALETTE[colorIdx];

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      )
        setPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  const pickColor = (e, idx) => {
    e.stopPropagation();
    colorMemory[details.id] = idx;
    setColorIdx(idx);
    setPickerOpen(false);
  };

  const togglePicker = (e) => {
    e.stopPropagation();
    setPickerOpen((o) => !o);
  };

  if (!(details.id >= 0)) return null;

  return (
    <>
      <style>{`
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
          justify-content: space-between;
          width: 100%;
          height: 100%;
          min-height: 40px;
          border-radius: 5px;
          padding: 0 5px 0 6px;
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

        .task-color-btn {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--task-accent);
          border: 1.5px solid rgba(255,255,255,0.25);
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.15s, border-color 0.15s;
          padding: 0;
          outline: none;
        }
        .task-color-btn:hover {
          transform: scale(1.3);
          border-color: rgba(255,255,255,0.7);
        }

        .task-picker {
          position: absolute;
          bottom: calc(100% + 5px);
          left: 50%;
          transform: translateX(-50%);
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 8px;
          padding: 6px;
          display: grid;
          grid-template-columns: repeat(4, 14px);
          gap: 5px;
          z-index: 99999;
          box-shadow: 0 8px 24px rgba(0,0,0,0.6);
          animation: picker-pop 0.12s ease-out;
        }
        @keyframes picker-pop {
          from { opacity: 0; transform: translateX(-50%) scale(0.85); }
          to   { opacity: 1; transform: translateX(-50%) scale(1); }
        }

        .task-swatch {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: transform 0.12s, border-color 0.12s;
        }
        .task-swatch:hover { transform: scale(1.25); }
        .task-swatch.active { border-color: white; }
      `}</style>

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
          <button
            ref={btnRef}
            className="task-color-btn"
            style={{ "--task-accent": color.accent }}
            onClick={togglePicker}
            title="Pick color"
          />
        </div>

        {pickerOpen && (
          <div className="task-picker" ref={pickerRef}>
            {PALETTE.map((c, i) => (
              <div
                key={c.name}
                className={`task-swatch${i === colorIdx ? " active" : ""}`}
                style={{ background: c.bg }}
                title={c.name}
                onClick={(e) => pickColor(e, i)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
