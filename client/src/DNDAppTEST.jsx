import { useCallback, useRef, useState } from "react";
import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import Sidebar from "./components/Sidebar";
import ContextMenu from "./context/ContextMenu";
import machineNode from "./components/machineNode";
import iotNode from "./components/iotNode";
import edgeSpace from "./components/edgeSpace";
import cloudSpace from "./components/cloudSpace";
import edgeLockedNode from "./components/edgeLockedNode";
import "./assets/flow.css";
import "./assets/index.css";

const machine = [{ id: -1, name: "empty machine", queue: [] }];
const iot = { id: -2, name: "empty iot", queue: [] };

const initialNodes = [
  {
    id: "1",
    type: "machineNode",
    data: { machine: machine },
    position: { x: 250, y: 70 },
  },
  {
    id: "2",
    type: "iotNode",
    data: { iot: iot },
    position: { x: 250, y: 140 },
  },
  {
    id: "edgeType",
    type: "edgeSpace",
    position: { x: -100, y: 200 },
    data: { label: "edges" },
  },
  {
    id: "cloudType",
    type: "cloudSpace",
    position: { x: 230, y: 200 },
    data: { label: "edges" },
  },
  {
    id: "A-2",
    type: "edgeLockedNode",
    data: { label: "Child Node 2" },
    position: { x: 10, y: 90 },
    parentId: "edgeType",
    extent: "parent",
  },
];
const nodeTypes = {
  machineNode: machineNode,
  iotNode: iotNode,
  edgeSpace: edgeSpace,
  cloudSpace: cloudSpace,
  edgeLockedNode: edgeLockedNode,
};
function DnDFlow() {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState(null);
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      const pane = reactFlowWrapper.current.getBoundingClientRect();

      setMenu({
        id: node.id,
        top: event.clientY < pane.height - 200 ? event.clientY : null,
        left: event.clientX < pane.width - 200 ? event.clientX : null,
        right:
          event.clientX >= pane.width - 200 ? pane.width - event.clientX : null,
        bottom:
          event.clientY >= pane.height - 200
            ? pane.height - event.clientY
            : null,
      });
    },
    [setMenu]
  );

  // Close the context menu if it's open whenever the window is clicked.
  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

  return (
    <div className=" p-8 bg-gray-100 size-dvw max-w-screen max-h-screen min-w-screen min-h-screen">
      <div className="dndflow">
        <div className="reactflow-wrapper " ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
            onNodeContextMenu={onNodeContextMenu}
            fitView
          >
            <Controls />
            <Background />
            {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
            <Panel position="top-left">
              <div className="xy-theme__button-group">
                <button className={`xy-theme__button ${""}`} onClick={() => {}}>
                  View Mode
                </button>
                <button className={`xy-theme__button ${""}`} onClick={() => {}}>
                  Wire Mode
                </button>
              </div>
            </Panel>
          </ReactFlow>
        </div>
        <Sidebar setNodes={setNodes} />
      </div>
    </div>
  );
}

export default function DNDApp() {
  return (
    <ReactFlowProvider>
      <DnDFlow />
    </ReactFlowProvider>
  );
}
