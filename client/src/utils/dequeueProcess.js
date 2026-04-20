import { eetTable } from "./exportCSV";

// Map the machine names in order to create an array regardless of machine name
let machineNameMap = {};

// Set Machine mapping
export const setMachineNameMap = (mapping) => {
  machineNameMap = mapping;
  console.log("Machine name mapping set:", machineNameMap);
};

// Auto generate based off the .json order
export const autoMapMachineNames = (configMachines) => {
  const eetMachines = eetTable.getMachines();
  machineNameMap = {};

  configMachines.forEach((machine, index) => {
    const configName = machine.name || machine.base_name;
    if (index < eetMachines.length) {
      machineNameMap[configName] = eetMachines[index];
    }
  });

  console.log("Auto-mapped machine names:", machineNameMap);
  return machineNameMap;
};

//Get EET machine name for a config machine
export const getEETMachineName = (configMachineName) => {
  return machineNameMap[configMachineName] || configMachineName;
};

//clear machine name mapping
export const clearMachineNameMap = () => {
  machineNameMap = {};
};

/**
 * Process dequeue for all machines based on EET lookup
 * @param {Array} machines - Array of machine objects
 * @param {number} simulationTime - Current simulation time
 * @returns {Object} - { machines: updated array, completed: dequeued tasks, deadlineMissed: late completions }
 */
export const processDequeue = (machines, simulationTime) => {
  const completed = [];
  const deadlineMissed = [];

  const classifyDone = (done, simulationTime) => {
    done.end_time = simulationTime;
    if (done.deadline && done.deadline > 0 && simulationTime > done.deadline) {
      done.status = "MISSED";
      deadlineMissed.push(done);
    } else {
      done.status = "COMPLETED";
      completed.push(done);
    }
  };

  const updatedMachines = machines.map((machine) => {
    const machineName = machine.base_name || machine.name;
    const eetMachineName = getEETMachineName(machineName);

    // If this machine group has replica_instances, process each replica independently
    if (machine.replica_instances?.length > 0) {
      let anyChange = false;
      const updatedReplicas = machine.replica_instances.map((replica) => {
        const queue = [...(replica.queue || [])];
        if (queue.length === 0) return replica;

        const currentTask = queue[0];
        const taskType = currentTask?.task_type;
        const taskStart = currentTask.start_time ?? currentTask.start ?? 0;
        const eet = eetTable.get(eetMachineName, taskType);

        if (eet !== null && simulationTime >= taskStart + eet) {
          const done = queue.shift();
          classifyDone(done, simulationTime);
          anyChange = true;
          console.log(
            `✓ Dequeued [${machineName} #${replica.replica_number}][${taskType}] task ${done.id} at t=${simulationTime.toFixed(3)} (EET: ${eet}) → ${done.status}`,
          );
          return { ...replica, queue };
        }
        return replica;
      });

      return anyChange
        ? { ...machine, replica_instances: updatedReplicas }
        : machine;
    }

    // Fallback: single-queue behavior for machines without replica_instances
    const queue = [...(machine.queue || [])];
    if (queue.length === 0) return machine;

    const currentTask = queue[0];
    const taskType = currentTask?.task_type;
    const taskStart = currentTask.start_time ?? currentTask.start ?? 0;
    const eet = eetTable.get(eetMachineName, taskType);

    if (eet !== null && simulationTime >= taskStart + eet) {
      const done = queue.shift();
      classifyDone(done, simulationTime);
      console.log(
        `✓ Dequeued [${machineName}][${taskType}] task ${done.id} at t=${simulationTime.toFixed(3)} (EET: ${eet}) → ${done.status}`,
      );
      return { ...machine, queue };
    }

    return machine;
  });

  return { machines: updatedMachines, completed, deadlineMissed };
};

/**
 * Single check for one machine/task
 */
export const canDequeue = (
  simulationTime,
  machineName,
  taskType,
  taskStartTime = 0,
) => {
  const eetMachineName = getEETMachineName(machineName);
  const eet = eetTable.get(eetMachineName, taskType);
  if (eet === null) return false;
  return simulationTime >= taskStartTime + eet;
};

/**
 * Get remaining time for current task
 */
export const getRemainingTime = (
  simulationTime,
  machineName,
  taskType,
  taskStartTime = 0,
) => {
  const eetMachineName = getEETMachineName(machineName);
  const eet = eetTable.get(eetMachineName, taskType);
  if (eet === null) return null;

  const elapsed = simulationTime - taskStartTime;
  return Math.max(0, eet - elapsed);
};

/**
 * Get task progress percentage (for progress bars)
 */
export const getTaskProgress = (
  simulationTime,
  machineName,
  taskType,
  taskStartTime = 0,
) => {
  const eetMachineName = getEETMachineName(machineName);
  const eet = eetTable.get(eetMachineName, taskType);
  if (eet === null || eet === 0) return 0;

  const elapsed = simulationTime - taskStartTime;
  return Math.min(100, (elapsed / eet) * 100);
};
