import {
  findFirstReachableNode,
  isTopologyReachable,
} from "./topologyRouting.js";

const nodeId = (node) => String(node?.id ?? "");

export const isLoadBalancerNode = (node) => node?.type === "LBNode";

export function getLoadBalancerDisplayName(id, data = {}) {
  const savedName = String(data?.name ?? "").trim();
  if (savedName) return savedName;

  const legacySequence = /^LBNode_(\d+)$/.exec(String(id));
  return legacySequence
    ? `Load Balancer ${Number(legacySequence[1]) + 1}`
    : `Load Balancer ${id}`;
}

export function createUniqueNodeId(type, nodes = []) {
  const prefix = `${type}_`;
  const usedIds = new Set(nodes.map(nodeId));
  let sequence = 0;

  while (usedIds.has(`${prefix}${sequence}`)) sequence += 1;
  return `${prefix}${sequence}`;
}

export function createUniqueLoadBalancerName(nodes = []) {
  const usedNames = new Set(
    nodes
      .filter(isLoadBalancerNode)
      .map((node) => String(node.data?.name ?? "").trim())
      .filter(Boolean),
  );
  let sequence = 1;

  while (usedNames.has(`Load Balancer ${sequence}`)) sequence += 1;
  return `Load Balancer ${sequence}`;
}

export function createLoadBalancerIdentity(nodes = [], timestamp = Date.now()) {
  const usedIds = new Set(nodes.map(nodeId));
  const usedNames = new Set(
    nodes
      .filter(isLoadBalancerNode)
      .map((node) => String(node.data?.name ?? "").trim())
      .filter(Boolean),
  );
  const parsedTimestamp = Math.trunc(Number(timestamp));
  let candidate = Number.isFinite(parsedTimestamp) && parsedTimestamp >= 0
    ? parsedTimestamp
    : Date.now();

  while (true) {
    const id = `LBNode_${candidate}`;
    const shortId = String(candidate).slice(-4).padStart(4, "0");
    const name = `Load Balancer ${shortId}`;

    if (!usedIds.has(id) && !usedNames.has(name)) return { id, name };
    candidate += 1;
  }
}

export function getSourceLoadBalancerId(sourceId, edges = [], nodes = []) {
  const loadBalancer = findFirstReachableNode(
    sourceId,
    isLoadBalancerNode,
    edges,
    nodes,
  );
  return loadBalancer ? nodeId(loadBalancer) : null;
}

export function isConnectedThroughLoadBalancer(
  sourceId,
  machineId,
  loadBalancerId,
  edges = [],
  nodes = [],
) {
  return (
    isTopologyReachable(sourceId, loadBalancerId, edges, nodes) &&
    isTopologyReachable(loadBalancerId, machineId, edges, nodes)
  );
}

export function isDirectlyConnected(sourceId, machineId, edges = []) {
  const source = String(sourceId);
  const machine = String(machineId);
  return edges.some(
    (edge) =>
      String(edge?.source) === source && String(edge?.target) === machine,
  );
}

