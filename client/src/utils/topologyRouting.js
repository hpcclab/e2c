import { isWorkspaceNode } from "./workspaceNodes.js";

const nodeId = (value) => String(value ?? "");

function findNode(id, nodes = []) {
  const normalizedId = nodeId(id);
  return nodes.find((node) => nodeId(node?.id) === normalizedId);
}

function directTargets(id, edges = []) {
  const normalizedId = nodeId(id);
  return edges
    .filter((edge) => nodeId(edge?.source) === normalizedId)
    .map((edge) => nodeId(edge?.target))
    .filter(Boolean);
}

function canReceiveWorkspaceTraffic(node) {
  return (
    isWorkspaceNode(node) ||
    node?.type === "LBNode" ||
    node?.type === "machineNode" ||
    node?.type === "autoScaler" ||
    node?.type === "edgeLockedNode"
  );
}

/**
 * Return the next routable nodes from a canvas node.
 *
 * Explicit connections remain directional. Workspace membership is an
 * implicit, zero-delay connection in both directions so a child can leave
 * through its workspace gateway and a workspace can deliver traffic to its
 * contained load balancers or machines.
 */
export function getTopologyNeighbors(id, edges = [], nodes = []) {
  const normalizedId = nodeId(id);
  const currentNode = findNode(normalizedId, nodes);
  const neighbors = directTargets(normalizedId, edges);

  if (currentNode?.parentId !== undefined && currentNode?.parentId !== null) {
    neighbors.push(nodeId(currentNode.parentId));
  }

  if (isWorkspaceNode(currentNode)) {
    nodes.forEach((node) => {
      if (
        nodeId(node?.parentId) === normalizedId &&
        canReceiveWorkspaceTraffic(node)
      ) {
        neighbors.push(nodeId(node.id));
      }
    });
  }

  return [...new Set(neighbors.filter(Boolean))];
}

export function findTopologyPath(sourceId, targetId, edges = [], nodes = []) {
  const source = nodeId(sourceId);
  const target = nodeId(targetId);
  if (!source || !target) return null;
  if (source === target) return [source];

  const queue = [[source]];
  const visited = new Set([source]);
  const knownNodeIds = new Set(nodes.map((node) => nodeId(node?.id)));

  while (queue.length) {
    const path = queue.shift();
    const current = path[path.length - 1];
    // Preserve legacy behavior: a direct source-to-target edge works without
    // node metadata, but an intermediate hop must be a real canvas node.
    if (current !== source && !knownNodeIds.has(current)) continue;
    for (const neighbor of getTopologyNeighbors(current, edges, nodes)) {
      if (visited.has(neighbor)) continue;
      const nextPath = [...path, neighbor];
      if (neighbor === target) return nextPath;
      visited.add(neighbor);
      queue.push(nextPath);
    }
  }

  return null;
}

export function isTopologyReachable(sourceId, targetId, edges = [], nodes = []) {
  return Boolean(findTopologyPath(sourceId, targetId, edges, nodes));
}

export function findFirstReachableNode(
  sourceId,
  predicate,
  edges = [],
  nodes = [],
) {
  const source = nodeId(sourceId);
  if (!source) return null;

  const nodeById = new Map(nodes.map((node) => [nodeId(node?.id), node]));
  const queue = [source];
  const visited = new Set([source]);

  while (queue.length) {
    const current = queue.shift();
    if (current !== source) {
      const node = nodeById.get(current);
      if (node && predicate(node)) return node;
    }

    if (current !== source && !nodeById.has(current)) continue;

    for (const neighbor of getTopologyNeighbors(current, edges, nodes)) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push(neighbor);
    }
  }

  return null;
}

/**
 * Find the network links a source uses to leave its local container. A direct
 * IoT connection takes precedence; otherwise the source inherits the first
 * ancestor workspace that has outgoing links.
 */
export function getEffectiveSourceEdges(sourceId, edges = [], nodes = []) {
  let currentId = nodeId(sourceId);
  const visited = new Set();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const outgoing = edges.filter(
      (edge) => nodeId(edge?.source) === currentId,
    );
    if (outgoing.length) return outgoing;

    const currentNode = findNode(currentId, nodes);
    currentId =
      currentNode?.parentId !== undefined && currentNode?.parentId !== null
        ? nodeId(currentNode.parentId)
        : "";
  }

  return [];
}
