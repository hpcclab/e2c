import { useDraggable } from "@neodrag/react";
import { useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGlobalState } from "../context/GlobalStates";

// Simple ID generator for nodes
let id = 0;
const getId = (type) => `${type}_${id++}`;
const machine = { id: -1, name: "empty machine", queue: [] };
const iot = { id: -2, name: "empty iot", queue: [] };

const NODE_CONFIG = [
  {
    type: "edgeSpace",
    label: "Edge Space",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    description: "Low-latency edge compute",
    accent: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.25)",
  },
  {
    type: "cloudSpace",
    label: "Cloud Space",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    ),
    description: "Scalable cloud resources",
    accent: "#818cf8",
    bg: "rgba(129,140,248,0.08)",
    border: "rgba(129,140,248,0.25)",
  },
  {
    type: "machineNode",
    label: "Machine",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    description: "Physical compute node",
    accent: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.25)",
  },
  {
    type: "iotNode",
    label: "IoT Device",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4" />
        <path d="M3.05 3.05a14 14 0 0 0 0 17.9M20.95 3.05a14 14 0 0 1 0 17.9" />
      </svg>
    ),
    description: "IoT sensor / emitter",
    accent: "#fb923c",
    bg: "rgba(251,146,60,0.08)",
    border: "rgba(251,146,60,0.25)",
  },
  {
    type: "workloadNode",
    label: "Work Space",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    description: "Grouped workload zone",
    accent: "#e879f9",
    bg: "rgba(232,121,249,0.08)",
    border: "rgba(232,121,249,0.25)",
  },
  {
    type: "LBNode",
    label: "Load Balancer",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="3" x2="12" y2="21" />
        <path d="M3 9l9-7 9 7" />
        <path d="M3 15l9 7 9-7" />
      </svg>
    ),
    description: "Distribute traffic evenly",
    accent: "#facc15",
    bg: "rgba(250,204,21,0.08)",
    border: "rgba(250,204,21,0.25)",
  },
];

// Shared card inner content — used both in sidebar and in the portal ghost
function NodeCardInner({ config, isDragging }) {
  return (
    <>
      <div className="sb-node-icon">{config.icon}</div>
      <div className="sb-node-text">
        <span className="sb-node-label">{config.label}</span>
        <span className="sb-node-desc">{config.description}</span>
      </div>
      <div className="sb-drag-pip">
        <span>
          <i />
          <i />
        </span>
        <span>
          <i />
          <i />
        </span>
        <span>
          <i />
          <i />
        </span>
      </div>
    </>
  );
}

const CARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');

  .sb-node-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    cursor: grab;
    transition: background 0.18s, border-color 0.18s, transform 0.15s, box-shadow 0.18s;
    border: 1px solid var(--card-border);
    background: var(--card-bg);
    user-select: none;
  }
  .sb-node-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.04), transparent 60%);
    pointer-events: none;
    border-radius: inherit;
  }
  .sb-node-card:hover {
    background: var(--card-hover-bg);
    border-color: var(--card-accent);
    box-shadow: 0 0 0 1px var(--card-accent), 0 4px 20px rgba(0,0,0,0.35);
    transform: translateY(-1px);
  }
  .sb-node-card:active { cursor: grabbing; transform: scale(0.97); }
  .sb-node-icon {
    width: 36px; height: 36px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    background: var(--icon-bg); border: 1px solid var(--card-border);
    flex-shrink: 0; color: var(--card-accent); transition: background 0.18s;
  }
  .sb-node-icon svg { width: 17px; height: 17px; }
  .sb-node-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .sb-node-label {
    font-family: 'Outfit', sans-serif; font-weight: 500; font-size: 13px;
    color: #57585a; letter-spacing: 0.01em; line-height: 1.2;
  }
  .sb-node-desc {
    font-family: 'DM Mono', monospace; font-size: 10px; color: #64748b;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sb-drag-pip {
    margin-left: auto; display: flex; flex-direction: column;
    gap: 2.5px; flex-shrink: 0; opacity: 0.3; transition: opacity 0.18s;
  }
  .sb-node-card:hover .sb-drag-pip { opacity: 0.7; }
  .sb-drag-pip span { display: flex; gap: 2.5px; }
  .sb-drag-pip i {
    width: 2.5px; height: 2.5px; border-radius: 50%;
    background: #94a3b8; display: block;
  }
`;

function DraggableNode({ config, onDrop }) {
  // The anchor element stays in the sidebar (invisible while dragging)
  const anchorRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  // Ghost position follows the mouse in a portal
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  // Remember card size so we can center the ghost under the cursor
  const cardSizeRef = useRef({ width: 190, height: 56 });

  useDraggable(anchorRef, {
    // Keep the actual element at 0,0; we move the ghost instead
    position: { x: 0, y: 0 },
    onDragStart: ({ event }) => {
      const rect = anchorRef.current.getBoundingClientRect();
      cardSizeRef.current = { width: rect.width, height: rect.height };
      setGhostPos({ x: rect.left, y: rect.top });
      setDragging(true);
    },
    onDrag: ({ event }) => {
      setGhostPos({
        x: event.clientX - cardSizeRef.current.width / 2,
        y: event.clientY - cardSizeRef.current.height / 2,
      });
    },
    onDragEnd: ({ event }) => {
      setDragging(false);
      onDrop(config.type, {
        x: event.clientX - cardSizeRef.current.width / 2,
        y: event.clientY - cardSizeRef.current.height / 2,
      });
    },
  });

  const cssVars = {
    "--card-bg": config.bg,
    "--card-hover-bg": config.bg.replace("0.08", "0.14"),
    "--card-border": config.border,
    "--card-accent": config.accent,
    "--icon-bg": config.bg.replace("0.08", "0.12"),
  };

  return (
    <>
      <style>{CARD_STYLES}</style>

      <div
        ref={anchorRef}
        className="sb-node-card"
        style={{ ...cssVars, opacity: dragging ? 0 : 1 }}
      >
        <NodeCardInner config={config} />
      </div>

      {dragging &&
        createPortal(
          <div
            className="sb-node-card"
            style={{
              ...cssVars,
              position: "fixed",
              left: ghostPos.x,
              top: ghostPos.y,
              width: cardSizeRef.current.width,
              pointerEvents: "none",
              zIndex: 99999,
              opacity: 0.92,
              boxShadow: `0 0 0 1px ${config.accent}, 0 8px 32px rgba(0,0,0,0.5)`,
              transform: "rotate(-1.5deg) scale(1.03)",
            }}
          >
            <NodeCardInner config={config} />
          </div>,
          document.body,
        )}
    </>
  );
}

export default function Sidebar() {
  const {
    setMachines,
    setIot,
    taskTypes,
    setTaskTypes,
    scenarioRows,
    setScenarioRows,
    setWorkspaces,
    workspaces,
    workspace,
    nodes,
    loadBalancers,
    setLoadBalancers,
  } = useGlobalState();

  const {
    setNodes,
    screenToFlowPosition,
    fitView,
    getNodes,
    getNodesBounds,
    getIntersectingNodes,
  } = useReactFlow();

  const distributionOptions = ["uniform", "normal", "exponential", "spiky"];

  const handleNodeDrop = useCallback(
    (nodeType, screenPosition) => {
      if (!screenToFlowPosition) return;

      const position = screenToFlowPosition({
        x: screenPosition.x,
        y: screenPosition.y,
      });
      const groupNodes = getNodes().filter((n) => n.type === "group");

      let parentNode = undefined;
      for (const group of groupNodes) {
        const bounds = getNodesBounds([group]);
        if (
          position.x >= bounds.x &&
          position.x <= bounds.x + bounds.width &&
          position.y >= bounds.y &&
          position.y <= bounds.y + bounds.height
        ) {
          parentNode = group;
          break;
        }
      }

      const parentId = parentNode?.id;
      const relativePosition = parentNode
        ? {
            x: position.x - parentNode.position.x,
            y: position.y - parentNode.position.y,
          }
        : position;

      if (nodeType === "machineNode") {
        const newMachine = {
          id: Date.now(),
          name: `Machine ${Date.now().toString().slice(-4)}`,
          queue: [],
          power: 0,
          idle_power: 0,
          replicas: 1,
          price: 0,
          cost: 0,
          position: relativePosition,
          parentId,
          extent: parentId ? "parent" : undefined,
          eet: {},
        };
        setMachines((prev) => [...prev, newMachine]);
        if (parentId) {
          setWorkspaces((prev) =>
            prev.map((ws) => {
              const workspaceId = parentId.replace("nd-", "");
              if (ws.id.toString() === workspaceId)
                return { ...ws, machines: [...ws.machines, newMachine.id] };
              return ws;
            }),
          );
        }
      } else if (nodeType === "iotNode") {
        const newIot = {
          id: Date.now(),
          name: `IOT ${Date.now().toString().slice(-4)}`,
          properties: {
            task_type: `IOT ${Date.now().toString().slice(-4)}`,
            dataInput: "default",
            meanSize: 6,
            urgency: "BestEffort",
            slack: 0,
            numTasks: 10,
            startTime: 0,
            endTime: 30,
            distribution: distributionOptions[0],
            taskColor: "Slate",
          },
          queue: [],
          position: relativePosition,
          parentId,
          extent: parentId ? "parent" : undefined,
        };
        setIot((prev) => [...prev, newIot]);
        setTaskTypes((prev) => [
          ...prev,
          {
            srcID: newIot.id,
            name: newIot.name,
            dataInput: newIot.properties.dataInput,
            meanSize: newIot.properties.meanSize,
            urgency: newIot.properties.urgency,
            slack: newIot.properties.slack,
            numTasks: newIot.properties.numTasks,
            startTime: newIot.properties.startTime,
            endTime: newIot.properties.endTime,
          },
        ]);
        setScenarioRows((prev) => [
          ...prev,
          {
            srcID: newIot.id,
            taskType: newIot.properties.task_type,
            numTasks: newIot.properties.numTasks,
            startTime: newIot.properties.startTime,
            endTime: newIot.properties.endTime,
            distribution: newIot.properties.distribution,
          },
        ]);
        setMachines((prev) =>
          prev.map((m) => ({
            ...m,
            eet: { ...(m.eet || {}), [newIot.name]: "" },
          })),
        );
        if (parentId) {
          setWorkspaces((prev) =>
            prev.map((ws) => {
              const workspaceId = parentId.replace("nd-", "");
              if (ws.id.toString() === workspaceId)
                return { ...ws, iots: [...ws.iots, newIot.id] };
              return ws;
            }),
          );
        }
      } else if (nodeType === "workloadNode") {
        const newWorkspace = {
          id: Date.now(),
          job_q: [],
          system_config: {},
          machines: [],
          iots: [],
        };
        setWorkspaces((prev) => [...prev, newWorkspace]);
        setNodes((nds) =>
          nds.concat({
            id: `nd-${newWorkspace.id}`,
            type: "group",
            position: relativePosition,
            data: { workspaceId: newWorkspace.id, nodes: [] },
            resizing: true,
            style: {
              width: 280,
              height: 250,
              minWidth: 280,
              minHeight: 250,
              backgroundColor: "rgba(240,240,240,0.25)",
            },
          }),
        );
      } else if (nodeType === "LBNode") {
        let lbID = getId(nodeType);
        setLoadBalancers((prev) => prev.concat(lbID));
        setNodes((nds) =>
          nds.concat({
            id: lbID,
            type: nodeType,
            position,
            data: {},
            parentId,
            extent: parentId ? "parent" : undefined,
          }),
        );
      } else {
        setNodes((nds) =>
          nds.concat({
            id: getId(nodeType),
            type: nodeType,
            position,
            data: {},
            parentId,
            extent: parentId ? "parent" : undefined,
          }),
        );
      }

      fitView({ padding: 0.5, duration: 600, interpolate: "smooth" });
    },
    [
      getNodes,
      setMachines,
      setIot,
      setWorkspaces,
      setTaskTypes,
      setScenarioRows,
      screenToFlowPosition,
      fitView,
    ],
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');

        .sidebar-shell {
          width: 210px;
          flex-shrink: 0;
          height: 100%;
          background: #0d1117;
          border-right: 1px solid #1e2530;
          display: flex;
          flex-direction: column;
          padding: 0;
          font-family: 'Outfit', sans-serif;
          position: relative;
        }
        .sidebar-shell::before {
          content: '';
          position: absolute;
          top: -80px;
          left: -60px;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .sb-header {
          padding: 18px 14px 12px;
          border-bottom: 1px solid #124dac;
        }
        .sb-header-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: black;
          margin-bottom: 4px;
        }
        .sb-header-title {
          font-size: 15px;
          font-weight: 600;
          color: #05397c;
          letter-spacing: -0.01em;
        }
        .sb-header-hint {
          margin-top: 8px;
          font-size: 10.5px;
          color: #3d5068;
          line-height: 1.5;
          font-weight: 300;
        }
        .sb-header-hint strong {
          color: #4d6a89;
          font-weight: 500;
        }

        .sb-section {
          padding: 14px 10px 6px;
          flex: 1;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .sb-section::-webkit-scrollbar { display: none; }

        .sb-section-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #2d3f52;
          padding: 0 2px;
          margin-bottom: 8px;
        }

        .sb-node-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .sb-divider {
          height: 1px;
          background: #1a2433;
          margin: 10px 2px;
        }

        .sb-footer {
          padding: 10px 14px 14px;
          border-top: 1px solid #1a2433;
        }
        .sb-footer-text {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: #263347;
          letter-spacing: 0.06em;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sb-footer-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 6px #34d399;
          flex-shrink: 0;
          animation: pulse-dot 2.4s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <aside className="sidebar-shell">
        <div className="sb-header">
          <div className="sb-header-eyebrow">Topology Builder</div>
          <div className="sb-header-title">Components</div>
          <div className="sb-header-hint">
            <strong>Drag</strong> nodes onto the canvas to build your system.
          </div>
        </div>

        <div className="sb-section">
          {/* <div className="sb-section-label">Infrastructure</div>
          <div className="sb-node-list">
            {NODE_CONFIG.slice(0, 2).map((cfg) => (
              <DraggableNode
                key={cfg.type}
                config={cfg}
                onDrop={handleNodeDrop}
              />
            ))}
          </div>

          <div className="sb-divider" /> */}

          <div className="sb-section-label">Compute</div>
          <div className="sb-node-list">
            {NODE_CONFIG.slice(2, 4).map((cfg) => (
              <DraggableNode
                key={cfg.type}
                config={cfg}
                onDrop={handleNodeDrop}
              />
            ))}
          </div>

          <div className="sb-divider" />

          <div className="sb-section-label">Topology</div>
          <div className="sb-node-list">
            {NODE_CONFIG.slice(4).map((cfg) => (
              <DraggableNode
                key={cfg.type}
                config={cfg}
                onDrop={handleNodeDrop}
              />
            ))}
          </div>
        </div>

        <div className="sb-footer">
          <div className="sb-footer-text">
            <span className="sb-footer-dot" />
            canvas ready
          </div>
        </div>
      </aside>
    </>
  );
}
