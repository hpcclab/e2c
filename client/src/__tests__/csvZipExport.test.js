import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import {
  buildCsvReportFiles,
  createSimulationReportZipFile,
} from "../utils/exportCSV.js";

const reportData = {
  simulationTime: 4.25,
  dataResults: [
    {
      id: 1,
      task_type: "Sensor, indoor",
      assigned_machine: "Machine 1",
      arrival_time: 0.1,
      start_time: 0.2,
      end_time: 1.2,
      execution_time: 1,
      deadline: 2,
      status: "COMPLETED",
    },
    {
      id: 2,
      task_type: "Sensor",
      assigned_machine: "Machine 1",
      arrival_time: 0.3,
      start_time: null,
      end_time: null,
      execution_time: 1.1,
      deadline: 1.3,
      status: "DNR",
    },
  ],
  missedTasks: [
    {
      id: 2,
      task_type: "Sensor",
      assigned_machine: "Machine 1",
      arrival_time: 0.3,
      deadline: 1.3,
      status: "DNR",
    },
  ],
  machines: [
    {
      id: 10,
      name: "Machine 1",
      power: 100,
      idle_power: 20,
      replicas: 1,
      price: 0.5,
      utilization_time: 0.001,
    },
  ],
};

test("builds four separate CSV reports with consistent columns", () => {
  const files = buildCsvReportFiles(reportData);

  assert.deepEqual(Object.keys(files), [
    "simulation_summary.csv",
    "simulation_tasks.csv",
    "missed_tasks.csv",
    "machine_stats.csv",
  ]);
  assert.match(files["simulation_summary.csv"], /Completed Tasks,1/);
  assert.match(files["simulation_tasks.csv"], /"Sensor, indoor"/);
  assert.match(files["simulation_tasks.csv"], /2,Sensor,Machine 1,0\.3,DNR,DNR/);
  assert.doesNotMatch(files["machine_stats.csv"], /Machine ID/);
});

test("creates one ZIP containing all four CSV reports", async () => {
  const { blob, filename } = await createSimulationReportZipFile(reportData);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const filenames = Object.keys(zip.files).sort();

  assert.match(filename, /^simulation_report_\d{8}T\d{6}\.zip$/);
  assert.deepEqual(filenames, [
    "machine_stats.csv",
    "missed_tasks.csv",
    "simulation_summary.csv",
    "simulation_tasks.csv",
  ]);

  const taskCsv = await zip.file("simulation_tasks.csv").async("string");
  assert.match(taskCsv, /^Task ID,Type,Assigned Machine/);
});

test("includes header-only CSVs when a report section has no rows", () => {
  const files = buildCsvReportFiles();

  assert.equal(files["simulation_tasks.csv"].split("\n").length, 1);
  assert.equal(files["missed_tasks.csv"].split("\n").length, 1);
  assert.equal(files["machine_stats.csv"].split("\n").length, 1);
});
