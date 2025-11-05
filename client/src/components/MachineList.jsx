import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import TaskList from "./TaskList";

// Define a list of colors for machines 
const machineColors = [
  'bg-blue-600',
  'bg-green-600',
  'bg-purple-600',
  'bg-red-600',
  'bg-yellow-600',
  'bg-pink-600',
  'bg-indigo-600',
  'bg-teal-600',
  'bg-orange-600',
  'bg-cyan-600',
];

export default function MachineList({machs, onClicked, onTaskClicked, setSelectedMachine, setSelectedTask, registerMachineSlotRef}) {
  const [expandedMachines, setExpandedMachines] = useState({});
  
  const getMachineColor = (index) => {
    return machineColors[index % machineColors.length];
  };

  const toggleMachineExpansion = (machineId) => {
    setExpandedMachines(prev => ({
      ...prev,
      [machineId]: !prev[machineId]
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
      colorIndex: machineIndex
    }));
  };
  
  return(
    <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
      {machs.map((machine, machineIndex) => {
        const hasReplicas = machine.replicas > 1;
        const isExpanded = expandedMachines[machine.id];
        const replicas = getMachineReplicas(machine, machineIndex);
        
        return (
          <div key={machine.id}>
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
                    if (registerMachineSlotRef) registerMachineSlotRef(machine.id, slotIdx, el);
                  }}
                />
              </div>

              <div
                onClick={()=>{
                  setSelectedMachine({
                    "id": machine.id,
                    "originalId": machine.id,
                    "name": machine.name, 
                    "replicaNumber": 0,
                    "queue": machine.queue,
                    "power": machine.power,
                    "idle_power": machine.idle_power,
                    "replicas": machine.replicas,
                    "price": machine.price,
                    "cost": machine.cost
                  })
                  onClicked()
                }}
                className={`text-white ${getMachineColor(machineIndex)} font-semibold w-20 h-10 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition text-xs`}
              >
                {machine.name}
                {hasReplicas && (
                  <span className="ml-1 text-xs">({machine.replicas})</span>
                )}
              </div>
            </div>

            {/* Replica Rows (shown when expanded) */}
            {hasReplicas && isExpanded && (
              <div className="ml-8 mt-2 space-y-2">
                {replicas.map((replica) => (
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
                          if (registerMachineSlotRef) registerMachineSlotRef(replica.id, slotIdx, el);
                        }}
                      />
                    </div>

                    <div
                      onClick={()=>{
                        setSelectedMachine({
                          "id": replica.id,
                          "originalId": replica.originalId,
                          "name": replica.displayName, 
                          "replicaNumber": replica.replicaNumber,
                          "queue": replica.queue,
                          "power": replica.power,
                          "idle_power": replica.idle_power,
                          "replicas": replica.replicas,
                          "price": replica.price,
                          "cost": replica.cost
                        })
                        onClicked()
                      }}
                      className={`text-white ${getMachineColor(replica.colorIndex)} font-semibold w-20 h-8 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition text-xs`}
                    >
                      {replica.displayName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
