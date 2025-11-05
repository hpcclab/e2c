import React, { createContext, useContext, useState, useCallback } from "react";
import { nanoid } from "nanoid";
import { arrayMove } from "@dnd-kit/sortable";

const DragAndDropContext = createContext(null);

const emptyTaskTemplate = {
  id: 1010,
  task_type: "empty",
  data_size: "",
  arrival_time: "",
  deadline: "",
};

const DEFAULT_CONTAINERS = [
  {
    id: "templates",
    items: [
      { id: nanoid(), content: "IOT", type: "sensor" },
      {
        id: nanoid(),
        content: "Processor",
        type: "computation",
      },
    ],
  },
  {
    id: "IOT",
    items: [],
  },
  {
    id: "Processors",
    items: [],
  },
];

export function DragAndDropProvider({ children }) {
  const [containers, setContainers] = useState(DEFAULT_CONTAINERS);
  const [activeId, setActiveId] = useState(null);
  const [selectedTargetContainer, setSelectedTargetContainer] = useState(null);

  const isCloneSource = (id) => id === "templates";

  const findContainerByItem = (itemId) =>
    containers.find((container) =>
      container.items.some((item) => item.id === itemId)
    );

  const findContainerById = (containerId) =>
    containers.find((container) => container.id === containerId);

  const findItemById = (itemId) => {
    for (const container of containers) {
      const item = container.items.find((item) => item.id === itemId);
      if (item) return item;
    }
    return null;
  };

  const handleReorder = useCallback(
    (activeId, overId) => {
      const activeContainer = findContainerByItem(activeId);
      const overContainer = findContainerByItem(overId);
      if (!activeContainer || !overContainer) return;

      const oldIndex = activeContainer.items.findIndex(
        (i) => i.id === activeId
      );
      const newIndex = overContainer.items.findIndex((i) => i.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      setContainers((prev) =>
        prev.map((container) =>
          container.id === activeContainer.id
            ? {
                ...container,
                items: arrayMove(container.items, oldIndex, newIndex),
              }
            : container
        )
      );
    },
    [containers]
  );

  const handleMoveItem = useCallback(
    (activeId, overContainerId) => {
      const activeItem = findItemById(activeId);
      const activeContainer = findContainerByItem(activeId);
      const overContainer = findContainerById(overContainerId);

      if (!activeItem || !activeContainer || !overContainer) return;

      const allowedMap = {
        sensor: "IOT",
        computation: "Processors",
      };
      const allowed = allowedMap[activeItem.type];

      if (allowed && overContainer.id !== allowed) return;

      const newItem = isCloneSource(activeContainer.id)
        ? { ...activeItem, id: nanoid() }
        : activeItem;

      setContainers((prev) =>
        prev.map((container) => {
          if (
            container.id === activeContainer.id &&
            !isCloneSource(activeContainer.id)
          ) {
            return {
              ...container,
              items: container.items.filter((item) => item.id !== activeId),
            };
          }
          if (container.id === overContainer.id) {
            return {
              ...container,
              items: [...container.items, newItem],
            };
          }
          return container;
        })
      );
    },
    [containers]
  );

  const getTemplates = () => {
    const templates = containers.find((c) => c.id === "templates");
    if (!templates) return [];

    if (selectedTargetContainer === "IOT") {
      return templates.items.filter((item) => item.type === "sensor");
    } else if (selectedTargetContainer === "Processors") {
      return templates.items.filter((item) => item.type === "computation");
    }

    return templates.items;
  };

  const getDroppableContainers = () =>
    containers.filter((container) => container.id !== "templates");

  const value = {
    containers,
    setContainers,
    activeId,
    setActiveId,
    selectedTargetContainer,
    setSelectedTargetContainer,
    getTemplates,
    getDroppableContainers,
    handleReorder,
    handleMoveItem,
    emptyTaskTemplate,
    findItemById,
    findContainerByItem,
  };

  return (
    <DragAndDropContext.Provider value={value}>
      {children}
    </DragAndDropContext.Provider>
  );
}

export const useDragAndDrop = () => {
  const context = useContext(DragAndDropContext);
  if (!context) {
    throw new Error("useDragAndDrop must be used within a DragAndDropProvider");
  }
  return context;
};
