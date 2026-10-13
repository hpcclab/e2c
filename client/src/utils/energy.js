export const DEFAULT_BATTERY_CAPACITY_J = 100;
export const DEFAULT_TASK_ENERGY_J = 1;
export const DEFAULT_REFERENCE_DATA_SIZE_KB = 6;
// Simulation-friendly starting values. They are intentionally conservative
// and remain fully editable in each device's properties.
export const DEFAULT_GENERATION_ENERGY_PER_KB_J = 0.1;
export const DEFAULT_PROCESSING_ENERGY_PER_KB_J = 0.5;

export const ENERGY_FAILURE_REASONS = Object.freeze({
  IOT_BATTERY_DEPLETED: "IOT_BATTERY_DEPLETED",
  MACHINE_BATTERY_DEPLETED: "MACHINE_BATTERY_DEPLETED",
});

const nonNegativeNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
};

export const normalizeEnergySource = (value) =>
  value === "Wired" ? "Grid-Powered" : value || "Grid-Powered";

export const isBatteryPowered = (device) =>
  normalizeEnergySource(device?.properties?.energySource ?? device?.energySource) ===
  "Battery";

export const batteryCapacityJ = (device) =>
  nonNegativeNumber(
    device?.properties?.batteryCapacityJ ?? device?.batteryCapacityJ,
    DEFAULT_BATTERY_CAPACITY_J,
  );

export const remainingBatteryJ = (device) =>
  nonNegativeNumber(
    device?.properties?.batteryRemainingJ ?? device?.batteryRemainingJ,
    batteryCapacityJ(device),
  );

const taskDataSizeKb = (task, fallback = DEFAULT_REFERENCE_DATA_SIZE_KB) =>
  nonNegativeNumber(task?.data_size, fallback);

export const sourceGenerationEnergyRateJPerKb = (source) => {
  const configured = source?.properties?.generationEnergyPerKbJ;
  if (configured !== undefined && configured !== null && configured !== "") {
    return nonNegativeNumber(configured, DEFAULT_GENERATION_ENERGY_PER_KB_J);
  }
  const legacyPerTask = source?.properties?.generationEnergyPerTaskJ;
  if (legacyPerTask !== undefined && legacyPerTask !== null) {
    const referenceSize = Math.max(
      Number.EPSILON,
      nonNegativeNumber(
        source?.properties?.meanSize,
        DEFAULT_REFERENCE_DATA_SIZE_KB,
      ),
    );
    return nonNegativeNumber(legacyPerTask, DEFAULT_TASK_ENERGY_J) / referenceSize;
  }
  return DEFAULT_GENERATION_ENERGY_PER_KB_J;
};

export const machineProcessingEnergyRateJPerKb = (machine) => {
  const configured = machine?.processingEnergyPerKbJ;
  if (configured !== undefined && configured !== null && configured !== "") {
    return nonNegativeNumber(configured, DEFAULT_PROCESSING_ENERGY_PER_KB_J);
  }
  const legacyPerTask = machine?.processingEnergyPerTaskJ;
  if (legacyPerTask !== undefined && legacyPerTask !== null) {
    return (
      nonNegativeNumber(legacyPerTask, DEFAULT_TASK_ENERGY_J) /
      DEFAULT_REFERENCE_DATA_SIZE_KB
    );
  }
  return DEFAULT_PROCESSING_ENERGY_PER_KB_J;
};

export const sourceGenerationEnergyJ = (source, task) =>
  sourceGenerationEnergyRateJPerKb(source) * taskDataSizeKb(task);

export const networkTransferEnergyJ = (task) =>
  nonNegativeNumber(task?.network_energy_j, 0);

export const sourceTaskEnergyJ = (source, task) =>
  sourceGenerationEnergyJ(source, task) + networkTransferEnergyJ(task);

export const machineTaskEnergyJ = (machine, task) =>
  machineProcessingEnergyRateJPerKb(machine) * taskDataSizeKb(task);

export const canSpendBattery = (device, energyJ) => {
  if (!isBatteryPowered(device)) return true;
  const remaining = remainingBatteryJ(device);
  return remaining > 0 && remaining + Number.EPSILON >= Math.max(0, energyJ);
};

export const failureReasonLabel = (reason) => {
  if (reason === ENERGY_FAILURE_REASONS.IOT_BATTERY_DEPLETED) {
    return "IoT battery depleted before generation or upload";
  }
  if (reason === ENERGY_FAILURE_REASONS.MACHINE_BATTERY_DEPLETED) {
    return "Machine battery depleted before processing";
  }
  return reason || "";
};
