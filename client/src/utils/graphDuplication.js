function cloneValue(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function expandSelectionWithDescendants(nodes, selectedNodeIds) {
  const selected = new Set(selectedNodeIds);
  let changed = true;

  while (changed) {
    changed = false;
    nodes.forEach((node) => {
      if (node.parentId && selected.has(node.parentId) && !selected.has(node.id)) {
        selected.add(node.id);
        changed = true;
      }
    });
  }

  return selected;
}

export function planGraphDuplication({
  nodes,
  edges,
  selectedNodeIds,
  createNodeId,
  offset = { x: 50, y: 50 },
}) {
  const selected = expandSelectionWithDescendants(nodes, selectedNodeIds);
  const selectedNodes = nodes.filter((node) => selected.has(node.id));
  const idMap = new Map(
    selectedNodes.map((node, index) => [
      node.id,
      createNodeId(node, index),
    ]),
  );

  const duplicatedNodes = selectedNodes.map((node) => {
    const parentWasDuplicated = node.parentId && idMap.has(node.parentId);
    return {
      ...cloneValue(node),
      id: idMap.get(node.id),
      parentId: parentWasDuplicated
        ? idMap.get(node.parentId)
        : node.parentId,
      position: parentWasDuplicated
        ? { ...node.position }
        : {
            x: node.position.x + offset.x,
            y: node.position.y + offset.y,
          },
      selected: true,
      dragging: false,
    };
  });

  const duplicatedEdges = edges
    .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
    .map((edge, index) => ({
      ...cloneValue(edge),
      id: `${edge.id}-copy-${Date.now()}-${index}`,
      source: idMap.get(edge.source),
      target: idMap.get(edge.target),
      selected: false,
    }));

  return { duplicatedNodes, duplicatedEdges, idMap, selected };
}
