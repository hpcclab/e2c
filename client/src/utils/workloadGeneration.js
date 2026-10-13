import { deadlineFromGeneration } from "./deadlines.js";
import {
  calculateArrivalTime,
  calculateTravelTime,
} from "./networkDelay.js";
import { getSourceEdgeNetwork } from "./edgeNetwork.js";
import { createRandomGenerator } from "./randomSeed.js";

export function sampleGenerationTimes(
  start,
  end,
  n,
  dist,
  random = Math.random,
) {
  let arr = [];
  if (dist === "uniform") {
    for (let i = 0; i < n; i++) {
      arr.push(Number((start + (end - start) * random()).toFixed(2)));
    }
  } else if (dist === "normal") {
    const mean = (start + end) / 2;
    const stddev = (end - start) / 6;
    for (let i = 0; i < n; i++) {
      const u = Math.max(Number.MIN_VALUE, random());
      const v = random();
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      let t = mean + stddev * z;
      t = Math.max(start, Math.min(end, t));
      arr.push(Number(t.toFixed(2)));
    }
  } else if (dist === "exponential") {
    const duration = end - start;
    const lambda = duration > 0 ? n / duration : Infinity;
    let time = start;
    for (let i = 0; i < n; i++) {
      const u = random();
      const interval = Number.isFinite(lambda)
        ? -Math.log(1 - u) / lambda
        : 0;
      time += interval;
      if (time > end) time = end;
      arr.push(Number(time.toFixed(2)));
    }
  } else if (dist === "spiky") {
    const spikes = Math.max(1, Math.floor(n / 10));
    for (let s = 0; s < spikes; s++) {
      const spikeTime = start + (end - start) * random();
      const spikeSize = Math.max(1, Math.floor(n / spikes));
      for (let i = 0; i < spikeSize; i++) {
        let t = spikeTime + ((random() - 0.5) * (end - start)) / 20;
        t = Math.max(start, Math.min(end, t));
        arr.push(Number(t.toFixed(2)));
      }
    }
    arr = arr.slice(0, n);
  } else {
    for (let i = 0; i < n; i++) {
      arr.push(Number((start + (end - start) * random()).toFixed(2)));
    }
  }
  arr.sort((a, b) => a - b);
  return arr;
}

export function getDataSizes(
  mean,
  stdv,
  numOfTasks,
  random = Math.random,
) {
  const sizes = [];
  for (let i = 0; i < numOfTasks; i++) {
    const u = Math.max(Number.MIN_VALUE, random());
    const v = random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    const sample = mean + stdv * z;
    sizes.push(Number(Math.abs(sample).toFixed(2)));
  }
  return sizes;
}

export function generateWorkload(
  scenarioRows,
  taskTypes,
  seedOffset = 0,
  edges = [],
) {
  const workload = [];
  scenarioRows.forEach((row, idx) => {
    const typeObj =
      (row.srcID !== undefined && row.srcID !== null && row.srcID !== ""
        ? (taskTypes || []).find((t) => String(t.srcID) === String(row.srcID))
        : undefined) ??
      (taskTypes || []).find((t) => t.name === row.taskType);
    const sourceNamespace = String(row.srcID ?? row.taskType ?? idx);
    const arrivalRandom = createRandomGenerator(
      row.arrivalSeed ?? typeObj?.arrivalSeed,
      `arrival:${sourceNamespace}`,
      seedOffset,
    );
    const dataSizeRandom = createRandomGenerator(
      typeObj?.dataSizeSeed ?? row.dataSizeSeed,
      `data-size:${sourceNamespace}`,
      seedOffset,
    );
    const sample = sampleGenerationTimes(
      Number(row.startTime),
      Number(row.endTime),
      Number(row.numTasks),
      row.distribution,
      arrivalRandom,
    );
    const parsedMeanSize = Number(typeObj?.meanSize ?? 100);
    const parsedStdv = Number(typeObj?.dataSizeStdDev ?? typeObj?.stdv ?? 1);
    const meanSize = Number.isFinite(parsedMeanSize) ? parsedMeanSize : 100;
    const stdv = Number.isFinite(parsedStdv) ? Math.max(0, parsedStdv) : 1;
    const edgeNetwork = getSourceEdgeNetwork(row.srcID, edges, typeObj);
    const connectivity = edgeNetwork.networkType;
    const dataRateKbps = edgeNetwork.dataRateKbps;
    const uploadPowerW = edgeNetwork.uploadPowerW;
    const dataSizes = getDataSizes(
      meanSize,
      stdv,
      sample.length,
      dataSizeRandom,
    );

    sample.forEach((generationTime, i) => {
      const travelTime = calculateTravelTime(
        dataSizes[i],
        connectivity,
        dataRateKbps,
      );
      const arrivalTime = calculateArrivalTime(
        generationTime,
        dataSizes[i],
        connectivity,
        dataRateKbps,
      );
      const networkEnergyJ = uploadPowerW * travelTime;
      workload.push({
        task_type: row.taskType,
        source_id: row.srcID,
        generation_time: generationTime,
        arrival_time: arrivalTime,
        travel_time: travelTime,
        connectivity,
        data_rate_kbps: dataRateKbps,
        network_upload_power_w: uploadPowerW,
        network_energy_j: Number(networkEnergyJ.toFixed(9)),
        distribution: row.distribution,
        data_size: dataSizes[i],
        status: "NEW",
        deadline: deadlineFromGeneration(generationTime, typeObj?.slack),
        start_time: arrivalTime,
        end_time: 0,
      });
    });
  });
  workload.sort((a, b) => a.arrival_time - b.arrival_time);
  return workload;
}
