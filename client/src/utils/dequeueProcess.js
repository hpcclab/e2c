import { eetTable } from './exportCSV';

// Map the machine names in order to create an array regardless of machine name
let machineNameMap = {};

// Set Machine mapping 
export const setMachineNameMap = (mapping) => {
  machineNameMap = mapping;
  console.log('Machine name mapping set:', machineNameMap);
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

    console.log('Auto-mapped machine names:', machineNameMap);
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
 * @returns {Object} - { machines: updated array, completed: dequeued tasks }
 */
export const processDequeue = (machines, simulationTime) => {
  const completed = [];

  const updatedMachines = machines.map(machine => {
    const machineName = machine.name || machine.base_name;
    const eetMachineName = getEETMachineName(machineName);
    const queue = [...(machine.queue || [])];
    

    if (!queue || queue.length === 0) return machine;

    const currentTask = queue[0];
    const taskType = currentTask?.task_type;
    const taskStart = currentTask.start_time ?? currentTask.start ?? 0;

    //Get EET Value using mapped name
    const eet = eetTable.get(eetMachineName, taskType);
    
    // if (simulationTime >= taskStart + EET) dequeue
    if (simulationTime >= (taskStart + eet)) {
        const done = queue.shift();
        done.status = 'COMPLETED';
        done.end_time = simulationTime;
        completed.push(done);
  
        console.log(`✓ Dequeued [${machineName}][${taskType}] task ${done.id} at t=${simulationTime.toFixed(3)} (EET: ${eet})`);
  
        return { ...machine, queue };
      }
  
      return machine;
    });
  return { machines: updatedMachines, completed };
};

/**
 * Single check for one machine/task
 */
export const canDequeue = (simulationTime, machineName, taskType, taskStartTime = 0) => {
    const eetMachineName = getEETMachineName(machineName);
    const eet = eetTable.get(eetMachineName, taskType);
    if (eet === null) return false;
    return simulationTime >= (taskStartTime + eet);
};

/**
 * Get remaining time for current task
 */
export const getRemainingTime = (simulationTime, machineName, taskType, taskStartTime = 0) => {
  const eetMachineName = getEETMachineName(machineName);
  const eet = eetTable.get(eetMachineName, taskType);
  if (eet === null) return null;
  
  const elapsed = simulationTime - taskStartTime;
  return Math.max(0, eet - elapsed);
};

/**
 * Get task progress percentage (for progress bars)
 */
export const getTaskProgress = (simulationTime, machineName, taskType, taskStartTime = 0) => {
  const eetMachineName = getEETMachineName(machineName);
  const eet = eetTable.get(eetMachineName, taskType);
  if (eet === null || eet === 0) return 0;
  
  const elapsed = simulationTime - taskStartTime;
  return Math.min(100, (elapsed / eet) * 100);
};