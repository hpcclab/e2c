import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import {
  buildExcelReportData,
  createSimulationWorkbook,
} from "../utils/exportExcel.js";

const reportData = {
  simulationTime: 4.25,
  schedulingMode: "batch",
  batchIntervalSeconds: 1,
  dataResults: [
    {
      id: 1,
      task_type: "Sensor",
      assigned_machine: "Machine 1",
      generation_time: 0,
      data_size: 10,
      connectivity: "Bluetooth",
      travel_time: 0.1,
      arrival_time: 0.1,
      batch_number: 1,
      batch_release_time: 1,
      batch_wait_time: 0.9,
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
      generation_time: 0.2,
      data_size: 10,
      connectivity: "Bluetooth",
      travel_time: 0.1,
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
      generation_time: 0.2,
      data_size: 10,
      connectivity: "Bluetooth",
      travel_time: 0.1,
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
  sources: [{ id: 20 }, { id: 21 }],
  edges: [{ id: "e1" }, { id: "e2" }, { id: "e3" }],
};

test("builds one worksheet dataset for each existing report CSV", () => {
  const sheets = buildExcelReportData(reportData);

  assert.deepEqual(Object.keys(sheets), [
    "Summary",
    "Tasks",
    "Missed Tasks",
    "Machines",
  ]);
  assert.equal(sheets.Tasks.length, 3);
  assert.equal(sheets["Missed Tasks"].length, 2);
  assert.equal(sheets.Machines.length, 2);
  assert.deepEqual(sheets.Summary.slice(9, 12), [
    ["Total Machines", 1],
    ["Total IoT Devices", 2],
    ["Total Edges", 3],
  ]);
  assert.deepEqual(sheets.Machines[0], [
    "Machine Name",
    "Power (W)",
    "Idle Power (W)",
    "Replicas",
    "Price ($/s)",
    "Utilization Time (hr)",
    "Total Cost ($)",
    "Tasks Processed",
    "Power Source",
    "Battery Capacity (J)",
    "Battery Remaining (J)",
    "Processing Energy Rate (J/KB)",
  ]);
  assert.equal(sheets.Tasks[1][11], 1);
  assert.equal(sheets.Tasks[1][12], 1);
  assert.equal(sheets.Tasks[1][13], 0.9);
  assert.equal(sheets.Tasks[1][14], 0.2);
  assert.equal(sheets.Tasks[1][15], 1.2);
  assert.equal(sheets.Tasks[2][14], "DNR");
  assert.equal(sheets.Tasks[2][15], "DNR");
});

test("creates a valid multi-sheet xlsx workbook", async () => {
  const workbook = createSimulationWorkbook(reportData);
  const buffer = await workbook.generateAsync({ type: "nodebuffer" });
  const loaded = await JSZip.loadAsync(buffer);
  const workbookXml = await loaded.file("xl/workbook.xml").async("string");
  const taskSheetXml = await loaded
    .file("xl/worksheets/sheet2.xml")
    .async("string");
  const machineSheetXml = await loaded
    .file("xl/worksheets/sheet4.xml")
    .async("string");

  ["Summary", "Tasks", "Missed Tasks", "Machines"].forEach((sheetName) => {
    assert.match(workbookXml, new RegExp(`name="${sheetName}"`));
  });
  assert.match(taskSheetXml, /<c r="O2" s="2"><v>0\.2<\/v><\/c>/);
  assert.match(
    taskSheetXml,
    /<c r="P3" t="inlineStr" s="2"><is><t xml:space="preserve">DNR<\/t><\/is><\/c>/,
  );
  assert.doesNotMatch(machineSheetXml, /Machine ID/);
  assert.match(machineSheetXml, /<c r="H2"><v>2<\/v><\/c>/);
});
