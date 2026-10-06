export const WORKSPACE_NODE_TYPES = new Set([
  "group",
  "workloadNode",
  "edgeSpace",
  "cloudSpace",
]);

export function isWorkspaceNode(node) {
  return WORKSPACE_NODE_TYPES.has(node?.type);
}

export function getWorkspaceKind(nodeType) {
  if (nodeType === "cloudSpace") return "cloud";
  if (nodeType === "edgeSpace") return "edge";
  return "workspace";
}

export function getWorkspaceName(nodeType) {
  if (nodeType === "cloudSpace") return "Cloud";
  if (nodeType === "edgeSpace") return "Edge";
  return "Workspace";
}
