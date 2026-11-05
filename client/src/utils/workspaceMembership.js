import { isWorkspaceNode } from "./workspaceNodes.js";

const deviceTypes = new Set(["machineNode", "iotNode", "userNode", "LBNode"]);
const size = (node, key) => Number(node.measured?.[key] ?? node[key] ?? node.style?.[key]) || 0;

function absolutePosition(node, nodes) {
  const position = { ...node.position };
  const visited = new Set([node.id]);
  let parent = nodes.find((candidate) => candidate.id === node.parentId);
  while (parent && !visited.has(parent.id)) {
    visited.add(parent.id);
    position.x += parent.position.x;
    position.y += parent.position.y;
    parent = nodes.find((candidate) => candidate.id === parent.parentId);
  }
  return position;
}

// Dragging an existing device over a space used to change only its position.
// Record containment as well, keeping its on-screen location unchanged.
export function attachDevicesToSpaces(nodes) {
  const spaces = nodes.filter(isWorkspaceNode);
  return nodes.map((node) => {
    if (!deviceTypes.has(node.type) || node.parentId || !node.position) return node;
    const candidates = spaces.filter((space) => {
      const origin = absolutePosition(space, nodes);
      return node.position.x >= origin.x && node.position.y >= origin.y &&
        node.position.x + size(node, "width") <= origin.x + size(space, "width") &&
        node.position.y + size(node, "height") <= origin.y + size(space, "height");
    }).sort((a, b) => size(a, "width") * size(a, "height") - size(b, "width") * size(b, "height"));
    const parent = candidates[0];
    if (!parent) return node;
    const origin = absolutePosition(parent, nodes);
    return {
      ...node,
      parentId: parent.id,
      extent: "parent",
      position: { x: node.position.x - origin.x, y: node.position.y - origin.y },
    };
  });
}

export function applyDeviceMembership(devices, nodes, source = false) {
  return devices.map((device) => {
    const id = source ? `nd_${device.id}` : String(device.id);
    const node = nodes.find((candidate) => candidate.id === id);
    return node ? { ...device, position: node.position, parentId: node.parentId, extent: node.extent } : device;
  });
}

export function updateWorkspaceMembers(workspaces, nodes, machines, sources) {
  return workspaces.map((workspace) => {
    const container = nodes.find((node) => isWorkspaceNode(node) &&
      String(node.data?.workspaceId ?? node.id.replace("nd-", "")) === String(workspace.id));
    if (!container) return workspace;
    return {
      ...workspace,
      machines: machines.filter((device) => device.parentId === container.id).map((device) => device.id),
      iots: sources.filter((device) => device.parentId === container.id).map((device) => device.id),
    };
  });
}
