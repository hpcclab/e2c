import React, { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import TaskList from "./TaskList";
import { MACHINE_ICON_MAP } from "../utils/machineIcons";
import { formatUtilizationTime } from "../utils/formatTime";

// Define a list of colors for machines
const machineColors = [
  "bg-blue-600",
  "bg-green-600",
  "bg-purple-600",
  "bg-red-600",
  "bg-yellow-600",
  "bg-pink-600",
  "bg-indigo-600",
  "bg-teal-600",
  "bg-orange-600",
  "bg-cyan-600",
];

export const Machine = ({
  machine,
  machineIndex = 0,
  onClicked,
  onTaskClicked,
  setSelectedMachine,
  setSelectedTask,
  registerMachineSlotRef,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  function handleChildClick(event) {
    event.stopPropagation();
    setSelectedMachine({
      id: machine.id,
      originalId: machine.id,
      name: machine.name,
      icon: machine.icon,
      replicaNumber: 0,
      queue: machine.queue,
      power: machine.power,
      idle_power: machine.idle_power,
      replicas: machine.replicas,
      price: machine.price,
      cost: machine.cost,
      utilization_time: machine.utilization_time || 0,
      total_cost: machine.total_cost || 0,
      total_tasks: machine.total_tasks || 0,
      eet: machine.eet || {},
    });
    onClicked();
  }
  const getMachineColor = () => {
    return machineColors[machineIndex % machineColors.length];
  };

  const toggleExpansion = () => {
    setIsExpanded((prev) => !prev);
  };

  const getMachineReplicas = () => {
    const replicaCount = machine.replicas || 1;
    const queue = machine.queue || [];
    return Array.from({ length: replicaCount }, (_, replicaIndex) => ({
      ...machine,
      id: `${machine.id}-replica-${replicaIndex}`,
      originalId: machine.id,
      replicaNumber: replicaIndex + 1,
      displayName: `${machine.name} #${replicaIndex + 1}`,
      colorIndex: machineIndex,
      queue: queue.filter((_, taskIndex) => taskIndex % replicaCount === replicaIndex),
    }));
  };

  // Calculate cost: price/hour × hours utilized (from simulation results)
  const calculateCost = (machineData) => {
    const hours = machineData.utilization_time || 0;
    const pricePerHour = machineData.price || 0;
    return (pricePerHour * hours).toFixed(2);
  };

  const hasReplicas = machine.replicas > 1;
  const replicas = getMachineReplicas();
  const totalCost = calculateCost(machine);
  const utilDisplay = formatUtilizationTime(machine.utilization_time || 0);
  const totalTasks = machine.total_tasks || 0;

  return (
    <div>
      {/* Main Machine Row */}
      <div className="bg-white border-4 p-4 rounded-lg shadow-md flex items-center space-x-4">
        {/* Expand/Collapse Button */}
        {hasReplicas && (
          <button
            onClick={toggleExpansion}
            className="text-gray-600 hover:text-gray-800 transition"
            title={isExpanded ? "Collapse replicas" : "Expand replicas"}
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
        )}

        <div className="flex space-x-2 flex-1">
          <TaskList
            machine={machine}
            onClicked={onTaskClicked}
            setSelectedTask={setSelectedTask}
            registerSlotRef={(slotIdx, el) => {
              if (registerMachineSlotRef)
                registerMachineSlotRef(machine.id, slotIdx, el);
            }}
          />
        </div>

        <div className="flex flex-col items-end space-y-1">
          {machine.icon && MACHINE_ICON_MAP[machine.icon] ? (
            <div
              onClick={handleChildClick}
              className="flex flex-col items-center cursor-pointer hover:scale-105 transition"
              title={`${totalTasks} tasks, ${utilDisplay.value}${utilDisplay.unit} × $${machine.price}/h = $${totalCost}`}
            >
              {(() => { const Icon = MACHINE_ICON_MAP[machine.icon]; return <Icon size={28} className="text-blue-600" />; })()}
              <span className="text-xs text-gray-700 font-semibold mt-0.5 max-w-[72px] truncate text-center">
                {machine.name}{hasReplicas && ` (${machine.replicas})`}
              </span>
            </div>
          ) : (
            <div
              onClick={handleChildClick}
              className={`text-white ${getMachineColor()} font-semibold w-20 h-10 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition text-xs`}
              title={`${totalTasks} tasks, ${utilDisplay.value}${utilDisplay.unit} × $${machine.price}/h = $${totalCost}`}
            >
              {machine.name}
              {hasReplicas && (
                <span className="ml-1 text-xs">({machine.replicas})</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Replica Rows (shown when expanded) */}
      {hasReplicas && isExpanded && (
        <div className="ml-8 mt-2 space-y-2">
          {replicas.map((replica) => {
            const replicaCost = calculateCost(replica);
            const replicaDisplay = formatUtilizationTime(replica.utilization_time || 0);
            const replicaTasks = replica.total_tasks || 0;

            return (
              <div
                key={replica.id}
                className="bg-gray-50 border-2 border-gray-300 p-3 rounded-lg shadow-sm flex items-center space-x-4"
              >
                <div className="flex space-x-2 flex-1">
                  <TaskList
                    machine={replica}
                    onClicked={onTaskClicked}
                    setSelectedTask={setSelectedTask}
                    registerSlotRef={(slotIdx, el) => {
                      if (registerMachineSlotRef)
                        registerMachineSlotRef(replica.id, slotIdx, el);
                    }}
                  />
                </div>

                <div className="flex flex-col items-end space-y-1">
                  <div
                    onClick={handleChildClick}
                    className={`text-white ${getMachineColor()} font-semibold w-20 h-8 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition text-xs`}
                    title={`${replicaTasks} tasks, ${replicaDisplay.value}${replicaDisplay.unit} × $${replica.price}/h = $${replicaCost}`}
                  >
                    {replica.displayName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
