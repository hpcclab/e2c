// Runtime snapshots update device data, not the canvas node's identity or
// measured geometry. Losing `measured` hides a React Flow node until the next
// ResizeObserver pass (and can repeatedly resize its parent space).
export function syncDeviceNodes(nodes, devices, source = false) {
  const matches = (node) => source
    ? node.type === "iotNode" || node.type === "userNode"
    : node.type === "machineNode";
  const lookup = new Map(nodes.map((node) => [node.id, node]));
  const updated = new Map(devices.map((device, index) => {
    const id = source ? `nd_${device.id}` : String(device.id);
    const existing = lookup.get(id);
    const parentId = lookup.has(device.parentId) ? device.parentId : undefined;
    return [id, {
      ...existing,
      id,
      type: source ? (device.properties?.user ? "userNode" : "iotNode") : "machineNode",
      data: { ...existing?.data, [source ? "iot" : "machine"]: device },
      position: device.position ?? existing?.position ?? { x: source ? 0 : 600, y: 80 + index * 150 },
      parentId,
      extent: parentId ? "parent" : undefined,
      draggable: true,
      expandParent: true,
    }];
  }));
  // Keep existing order, including parents before children; append only new
  // devices. Explicitly deleted devices still disappear as intended.
  const result = nodes.flatMap((node) => {
    if (!matches(node)) return [node];
    const replacement = updated.get(node.id);
    updated.delete(node.id);
    return replacement ? [replacement] : [];
  });
  return [...result, ...updated.values()];
}
