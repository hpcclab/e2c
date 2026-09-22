import JSZip from "jszip";
import { downloadBlob } from "./downloadBlob.js";

const ZIP_MIME_TYPE = "application/zip";

const normalizeStatus = (status) => String(status || "").toUpperCase();
const getTaskId = (task) => task.taskId ?? task.id ?? "N/A";

const getTaskTime = (task, key) => {
  if (normalizeStatus(task.status) === "DNR") return "DNR";
  const value = task[key];
  return value === null || value === undefined ? "N/A" : value;
};

const getMachineTaskCount = (machine, tasks) =>
  tasks.filter((task) => {
    const assignedMachine = task.assigned_machine || "";
    return (
      assignedMachine === machine.name ||
      assignedMachine.startsWith(`${machine.name} #`)
    );
  }).length;

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[,"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const rowsToCsv = (rows) =>
  rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");

export const buildCsvReportFiles = ({
  dataResults = [],
  missedTasks = [],
  machines = [],
  simulationTime = 0,
} = {}) => {
  const machineList = machines.filter((machine) => machine.id !== -1);
  const completedTasks = dataResults.filter(
    (task) => normalizeStatus(task.status) === "COMPLETED",
  ).length;
  const totalCost = machineList.reduce(
    (sum, machine) =>
      sum +
      (Number(machine.price) || 0) *
        (Number(machine.utilization_time) || 0) *
        3600,
    0,
  );

  const rowsByFile = {
    "simulation_summary.csv": [
      ["Metric", "Value"],
      ["Simulation Time (s)", Number(simulationTime) || 0],
      ["Total Tasks", dataResults.length],
      ["Completed Tasks", completedTasks],
      ["Missed Tasks", missedTasks.length],
      ["Total Machines", machineList.length],
      ["Total Cost ($)", totalCost],
    ],
    "simulation_tasks.csv": [
      [
        "Task ID",
        "Type",
        "Assigned Machine",
        "Arrival Time",
        "Start Time",
        "Completion Time",
        "Exec Time",
        "Status",
        "Deadline",
      ],
      ...dataResults.map((task) => [
        getTaskId(task),
        task.task_type || "N/A",
        task.assigned_machine || "N/A",
        task.arrival_time ?? "N/A",
        getTaskTime(task, "start_time"),
        getTaskTime(task, "end_time"),
        task.execution_time ?? "N/A",
        task.status || "N/A",
        task.deadline ?? "N/A",
      ]),
    ],
    "missed_tasks.csv": [
      [
        "Task ID",
        "Type",
        "Assigned Machine",
        "Arrival Time",
        "Deadline",
        "Status",
      ],
      ...missedTasks.map((task) => [
        getTaskId(task),
        task.task_type || "N/A",
        task.assigned_machine || "N/A",
        task.arrival_time ?? "N/A",
        task.deadline ?? "N/A",
        task.status || "MISSED",
      ]),
    ],
    "machine_stats.csv": [
      [
        "Machine Name",
        "Power (W)",
        "Idle Power (W)",
        "Replicas",
        "Price ($/s)",
        "Utilization Time (hr)",
        "Total Cost ($)",
        "Tasks Processed",
      ],
      ...machineList.map((machine) => [
        machine.name || "N/A",
        Number(machine.power) || 0,
        Number(machine.idle_power) || 0,
        Number(machine.replicas) || 1,
        Number(machine.price) || 0,
        Number(machine.utilization_time) || 0,
        (Number(machine.price) || 0) *
          (Number(machine.utilization_time) || 0) *
          3600,
        getMachineTaskCount(machine, dataResults),
      ]),
    ],
  };

  return Object.fromEntries(
    Object.entries(rowsByFile).map(([filename, rows]) => [
      filename,
      rowsToCsv(rows),
    ]),
  );
};

export const createSimulationReportZipFile = async (reportData) => {
  const zip = new JSZip();
  const files = buildCsvReportFiles(reportData);

  Object.entries(files).forEach(([filename, contents]) => {
    zip.file(filename, contents);
  });

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: ZIP_MIME_TYPE,
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");

  return {
    blob,
    filename: `simulation_report_${timestamp}.zip`,
  };
};

export const exportSimulationReport = async (reportData) => {
  const { blob, filename } = await createSimulationReportZipFile(reportData);
  downloadBlob(blob, filename);
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
