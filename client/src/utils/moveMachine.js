import { isWorkspaceNode } from "./workspaceNodes.js";

function absolutePosition(node, nodes) {
  const position = { ...node.position };
  const visited = new Set([node.id]);
  let parentId = node.parentId;
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = nodes.find((candidate) => candidate.id === parentId);
    if (!parent) break;
    position.x += parent.position.x;
    position.y += parent.position.y;
    parentId = parent.parentId;
  }
  return position;
}

const widthOf = (node) => Number(node.measured?.width ?? node.width ?? node.style?.width) || 280;
const heightOf = (node) => Number(node.measured?.height ?? node.height ?? node.style?.height) || 140;

export function planMachineMove(nodes, machineId, destinationId = null) {
  const node = nodes.find((candidate) => String(candidate.id) === String(machineId));
  if (node?.type !== "machineNode") return null;
  const destination = destinationId
    ? nodes.find((candidate) => candidate.id === destinationId)
    : null;
  if (destinationId && !isWorkspaceNode(destination)) return null;

  if (!destination) {
    let position = absolutePosition(node, nodes);
    const parent = nodes.find((candidate) => candidate.id === node.parentId);
    if (parent) {
      const parentPosition = absolutePosition(parent, nodes);
      // Place the detached machine visibly outside its former container.
      position = { x: parentPosition.x + widthOf(parent) + 32, y: position.y };
    }
    return { position, parentId: undefined, extent: undefined };
  }

  const children = nodes.filter((candidate) =>
    candidate.parentId === destination.id && candidate.id !== node.id,
  );
  const position = {
    x: 24,
    y: children.reduce((bottom, child) =>
      Math.max(bottom, child.position.y + heightOf(child) + 24), 60),
  };
  return {
    position,
    parentId: destination.id,
    extent: "parent",
    workspaceSize: {
      width: Math.max(widthOf(destination), position.x + widthOf(node) + 24),
      height: Math.max(heightOf(destination), position.y + heightOf(node) + 24),
    },
  };
}
