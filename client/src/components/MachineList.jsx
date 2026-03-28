import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import TaskList from "./TaskList";

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

export default function MachineList({
  machs,
  onClicked,
  onTaskClicked,
  setSelectedMachine,
  setSelectedTask,
  registerMachineSlotRef,
}) {
  const [expandedMachines, setExpandedMachines] = useState({});

  const getMachineColor = (index) => {
    return machineColors[index % machineColors.length];
  };

  const toggleMachineExpansion = (machineId) => {
    setExpandedMachines((prev) => ({
      ...prev,
      [machineId]: !prev[machineId],
    }));
  };

  const getMachineReplicas = (machine, machineIndex) => {
    const replicas = machine.replicas || 1;
    return Array.from({ length: replicas }, (_, replicaIndex) => ({
      ...machine,
      id: `${machine.id}-replica-${replicaIndex}`,
      originalId: machine.id,
      replicaNumber: replicaIndex + 1,
      displayName: `${machine.name} #${replicaIndex + 1}`,
      colorIndex: machineIndex,
    }));
  };

  // Calculate cost: price/hour × hours utilized (from simulation results)
  const calculateCost = (machine) => {
    const hours = machine.utilization_time || 0; // actual utilization hours from simulation
    const pricePerHour = machine.price || 0;
    return (pricePerHour * hours).toFixed(2);
  };
  function handleChildClick(event) {
    event.stopPropagation();
    setSelectedMachine({
      id: machine.id,
      originalId: machine.id,
      name: machine.name,
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
  return (
    <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
      {machs.map((machine, machineIndex) => {
        const hasReplicas = machine.replicas > 1;
        const isExpanded = expandedMachines[machine.id];
        const replicas = getMachineReplicas(machine, machineIndex);
        const totalCost = calculateCost(machine);
        const utilizationHours = (machine.utilization_time || 0).toFixed(3);
        const totalTasks = machine.total_tasks || 0;

        return (
          <div key={`machine-${machine.id}`}>
            {/* Main Machine Row */}
            <div className="bg-white border-4 p-4 rounded-lg shadow-md flex items-center space-x-4">
              {/* Expand/Collapse Button */}
              {hasReplicas && (
                <button
                  onClick={() => toggleMachineExpansion(machine.id)}
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
                <div
                  onClick={handleChildClick}
                  className={`text-white ${getMachineColor(machineIndex)} font-semibold w-20 h-10 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition text-xs`}
                  title={`${totalTasks} tasks, ${utilizationHours}h × $${machine.price}/h = $${totalCost}`}
                >
                  {machine.name}
                  {hasReplicas && (
                    <span className="ml-1 text-xs">({machine.replicas})</span>
                  )}
                </div>
              </div>
            </div>

            {/* Replica Rows (shown when expanded) */}
            {hasReplicas && isExpanded && (
              <div className="ml-8 mt-2 space-y-2">
                {replicas.map((replica) => {
                  const replicaCost = calculateCost(replica);
                  const replicaHours = (replica.utilization_time || 0).toFixed(
                    3,
                  );
                  const replicaTasks = replica.total_tasks || 0;

                  return (
                    <div
                      key={`replica-${replica.originalId}-${replica.replicaNumber}`}
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
                          className={`text-white ${getMachineColor(replica.colorIndex)} font-semibold w-20 h-8 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition text-xs`}
                          title={`${replicaTasks} tasks, ${replicaHours}h × $${replica.price}/h = $${replicaCost}`}
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
      })}
    </div>
  );
}
