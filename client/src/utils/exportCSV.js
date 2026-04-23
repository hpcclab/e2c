export const exportToCSV = (data, filename = 'report.csv') => {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }
  
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      // Header row
      headers.join(','),
      // Data rows
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that contain commas, quotes, or newlines
          if (value === null || value === undefined) {
            return '';
          }
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');
  
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };
  
  // Export everything as a single combined CSV
  export const exportCombinedReport = (reportData) => {
    const {
      dataResults = [],
      missedTasks = [],
      machines = [],
      simulationTime = 0,
    } = reportData;
    
    // Calculate summary stats
    const totalTasks = dataResults.length;
    const tasksMapped = dataResults.filter(t => t.status === 'COMPLETED' || t.status === 'MAPPED').length;
    const tasksCompleted = dataResults.filter(t => t.status === 'COMPLETED').length;
    const tasksCancelled = dataResults.filter(t => t.status === 'CANCELLED').length;
    const completionPercentage = totalTasks > 0 ? ((tasksCompleted / totalTasks) * 100).toFixed(2) : 0;
    
    const totalEnergyConsumed = machines
        .filter(m => m.id !== -1)
        .reduce((sum, machine) => {
        const power = machine.power || 0;
        const utilizationTime = machine.utilization_time || 0;
        return sum + (power * utilizationTime) / 1000;
        }, 0);

    const totalCost = machines
        .filter(m => m.id !== -1)
        .reduce((sum, m) => sum + ((m.price || 0) * (m.utilization_time || 0) * 3600), 0);

    // Group missed tasks by type
    const missedByType = missedTasks.reduce((acc, task) => {
        const type = task.task_type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    
    let csvContent = '';
    // Summary Statistics Section
    csvContent += 'SUMMARY STATISTICS\n';
    csvContent += `Simulation Time (s),${simulationTime}\n`;
    csvContent += `Total Tasks,${totalTasks}\n`;
    csvContent += `Tasks Mapped,${tasksMapped}\n`;
    csvContent += `Tasks Completed,${tasksCompleted}\n`;
    csvContent += `Tasks Cancelled,${tasksCancelled}\n`;
    csvContent += `Tasks Missed,${missedTasks.length}\n`;
    csvContent += `Completion Rate (%),${completionPercentage}\n`;
    csvContent += `Total Energy Consumed (kWh),${totalEnergyConsumed.toFixed(4)}\n`;
    csvContent += `Total Cost ($),${totalCost.toFixed(2)}\n`;
    csvContent += '\n';

    // Missed Tasks by Type
    if (Object.keys(missedByType).length > 0) {
        csvContent += 'MISSED TASKS BY TYPE\n';
        csvContent += 'Task Type,Count,Percentage\n';
        Object.entries(missedByType).forEach(([type, count]) => {
        const percentage = ((count / missedTasks.length) * 100).toFixed(1);
        csvContent += `${type},${count},${percentage}%\n`;
        });
        csvContent += '\n';
    }

  // Energy Consumption by Machine
  csvContent += 'ENERGY CONSUMPTION BY MACHINE\n';
  csvContent += 'Machine Name,Power (W),Utilization (hr),Energy (kWh),Cost ($)\n';
  machines
    .filter(m => m.id !== -1)
    .forEach(machine => {
      const energyKWh = ((machine.power || 0) * (machine.utilization_time || 0)) / 1000;
      const cost = (machine.price || 0) * (machine.utilization_time || 0) * 3600;
      csvContent += `${machine.name},${machine.power || 0},${(machine.utilization_time || 0).toFixed(4)},${energyKWh.toFixed(4)},${cost.toFixed(2)}\n`;
    });
  csvContent += `Total,,,${totalEnergyConsumed.toFixed(4)},${totalCost.toFixed(2)}\n`;
  csvContent += '\n';

    // Summary Section
    csvContent += 'FULL SIMULATION SUMMARY\n';
    csvContent += `Simulation Time,${simulationTime}\n`;
    csvContent += `Total Tasks,${dataResults.length}\n`;
    csvContent += `Completed Tasks,${dataResults.filter(t => t.status === 'completed').length}\n`;
    csvContent += `Missed Tasks,${missedTasks.length}\n`;
    csvContent += `Total Machines,${machines.filter(m => m.id !== -1).length}\n`;
    csvContent += '\n';
  
    // Machine Statistics Section
    csvContent += 'TASK BASED SIMULATION REPORT\n';
    csvContent += 'Task ID,Type,Assigned Machine,Arrival Time,Start Time,End Time,Exec Time,Deadline,Status\n';  // ADD Exec Time
    dataResults.forEach(task => {
      csvContent += `${task.taskId || task.id},${task.task_type || 'N/A'},${task.assigned_machine || 'N/A'},${task.arrival_time ?? 'N/A'},${task.start ?? 'N/A'},${task.end ?? 'N/A'},${task.execution_time ?? 'N/A'},${task.deadline ?? 'N/A'},${task.status || 'N/A'}\n`;
    });
    csvContent += '\n';
  
    // Task Results Section
    csvContent += 'TASK BASED SIMULASTION REPORT\n';
    csvContent += 'Task ID,Type,Assigned Machine,Arrival Time,Start Time,End Time,Status,Deadline\n';
    dataResults.forEach(task => {
      csvContent += `${task.taskId || task.id},${task.task_type || 'N/A'},${task.assigned_machine || 'N/A'},${task.arrival_time || 'N/A'},${task.start || 'N/A'},${task.end || 'N/A'},${task.status || 'N/A'},${task.deadline || 'N/A'}\n`;
    });
    csvContent += '\n';
  
    // Missed Tasks Section
    if (missedTasks.length > 0) {
      csvContent += 'MISSED TASKS\n';
      csvContent += 'Task ID,Type,Assigned Machine,Arrival Time,Deadline,Status\n';
      missedTasks.forEach(task => {
        csvContent += `${task.taskId || task.id},${task.task_type || 'N/A'},${task.assigned_machine || 'N/A'},${task.arrival_time || 'N/A'},${task.deadline || 'N/A'},${task.status || 'Missed'}\n`;
      });
    }
  
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `simulation_report_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };
  
  // Export separate CSV files for each section
  export const exportSimulationReport = (reportData) => {
    const {
      dataResults = [],
      missedTasks = [],
      machines = [],
      simulationTime = 0,
    } = reportData;
  
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  
    // Export task results
    if (dataResults.length > 0) {
      const taskData = dataResults.map(task => ({
        'Task ID': task.taskId || task.id,
        'Type': task.task_type || 'N/A',
        'Assigned Machine': task.assigned_machine || 'N/A',
        'Arrival Time': task.arrival_time || 'N/A',
        'Start Time': task.start || 'N/A',
        'Completion Time': task.end || 'N/A',
        'Exec Time': task.execution_time || 'N/A',
        'Status': task.status || 'N/A',
        'Deadline': task.deadline || 'N/A',
      }));
      exportToCSV(taskData, `simulation_tasks_${timestamp}.csv`);
    }
  
    // Export missed tasks
    if (missedTasks.length > 0) {
      const missedData = missedTasks.map(task => ({
        'Task ID': task.taskId || task.id,
        'Type': task.task_type || 'N/A',
        'Assigned Machine': task.assigned_machine || 'N/A',
        'Arrival Time': task.arrival_time || 'N/A',
        'Deadline': task.deadline || 'N/A',
        'Status': task.status || 'Missed',
      }));
      exportToCSV(missedData, `missed_tasks_${timestamp}.csv`);
    }
  
    // Export machine statistics
    if (machines.length > 0) {
      const machineData = machines
        .filter(m => m.id !== -1)
        .map(machine => ({
          'Machine ID': machine.id,
          'Machine Name': machine.name,
          'Power': machine.power || 0,
          'Idle Power': machine.idle_power || 0,
          'Replicas': machine.replicas || 1,
          'Price ($/s)': machine.price || 0,
          'Utilization Time (hr)': machine.utilization_time || 0,
          'Total Cost ($)': ((machine.price || 0) * (machine.utilization_time || 0) * 3600).toFixed(2),
          'Tasks Processed': machine.queue?.length || 0,
        }));
      exportToCSV(machineData, `machine_stats_${timestamp}.csv`);
    }
  
    // Export summary
    const summaryData = [{
      'Simulation Time': simulationTime,
      'Total Tasks': dataResults.length,
      'Completed Tasks': dataResults.filter(t => t.status === 'completed').length,
      'Missed Tasks': missedTasks.length,
      'Total Machines': machines.filter(m => m.id !== -1).length,
      'Total Cost': machines
        .filter(m => m.id !== -1)
        .reduce((sum, m) => sum + ((m.price || 0) * (m.utilization_time || 0) * 3600), 0)
        .toFixed(2),
    }];
    exportToCSV(summaryData, `simulation_summary_${timestamp}.csv`);
  };

   /**
    EET Table Processing     
    **/
    class EETTable {
    constructor() {
      this.table = {};  // { machineName: { taskType: eet } }
    }
  
    /**
     * Parse CSV where rows are task types and columns are machines
     */
    loadFromCSV(csvString) {
      this.table = {};
      
      const lines = csvString.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must have headers and at least one data row');
      }
  
      // task_type, m1, m2, m3 --> headers 
      const headers = lines[0].split(',').map(h => h.trim());
      const machineNames = headers.slice(1);
  
      // Initialize machines
      machineNames.forEach(machine => {
        this.table[machine] = {};
      });
  
      // Parse rows 
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 2) continue;
  
        const taskType = values[0];
        
        machineNames.forEach((machine, idx) => {
          const eet = parseFloat(values[idx + 1]);
          if (!isNaN(eet)) {
            this.table[machine][taskType] = eet;
          }
        });
      }
  
      console.log('EET Table loaded:', this.table);
      return this;
    }
  
    /**
     * Get EET
     */
    get(machineName, taskType) {
      return this.table[machineName]?.[taskType] ?? null;
    }
  
    /**
     * if (simulationTime >= taskStartTime + EET) dequeue
     */
    shouldDequeue(simulationTime, machineName, taskType, taskStartTime = 0) {
      const eet = this.get(machineName, taskType);
      if (eet === null) {
        console.warn(`No EET found for [${machineName}][${taskType}]`);
        return false;
      }
      return simulationTime >= (taskStartTime + eet);
    }
  
    getMachines() {
      return Object.keys(this.table);
    }
  
    getTaskTypes() {
      const types = new Set();
      Object.values(this.table).forEach(machine => {
        Object.keys(machine).forEach(t => types.add(t));
      });
      return Array.from(types);
    }
  
    /**
     * For UI
     */
    toMatrix() {
      const machines = this.getMachines();
      const taskTypes = this.getTaskTypes();
      
      return {
        headers: ['Task Type', ...machines],
        rows: taskTypes.map(type => [
          type,
          ...machines.map(m => this.get(m, type) ?? '-')
        ])
      };
    }
  
    /**
     * Load EET from a plain object { machineName: { taskType: eet } }
     */
    loadFromObject(table) {
      this.table = { ...table };
      return this;
    }

    isEmpty() {
      return Object.keys(this.table).length === 0;
    }
  }
  
  // Singleton instance
  export const eetTable = new EETTable();
  
  /**
   * Parse EET CSV file upload
   */
  export const parseEETCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          eetTable.loadFromCSV(e.target.result);
          resolve(eetTable);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };
  
  /**
   * Load EET from string (if embedded in config)
   */
  export const loadEETFromString = (csvString) => {
    eetTable.loadFromCSV(csvString);
    return eetTable;
  };
  
  export default eetTable;

  /**
 * Import EET CSV and return parsed table
 */
export const importEETCSV = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvString = event.target.result;
        const lines = csvString.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const machineNames = headers.slice(1);
        
        const table = {};
        machineNames.forEach(m => { table[m] = {}; });
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const taskType = values[0];
          
          machineNames.forEach((machine, idx) => {
            const eet = parseFloat(values[idx + 1]);
            if (!isNaN(eet)) {
              table[machine][taskType] = eet;
            }
          });
        }
        
        resolve(table);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read EET file'));
    reader.readAsText(file);
  });
};