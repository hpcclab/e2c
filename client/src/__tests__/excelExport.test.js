import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import {
  buildExcelReportData,
  createSimulationWorkbook,
} from "../utils/exportExcel.js";

const reportData = {
  simulationTime: 4.25,
  dataResults: [
    {
      id: 1,
      task_type: "Sensor",
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
  assert.deepEqual(sheets.Machines[0], [
    "Machine Name",
    "Power (W)",
    "Idle Power (W)",
    "Replicas",
    "Price ($/s)",
    "Utilization Time (hr)",
    "Total Cost ($)",
    "Tasks Processed",
  ]);
  assert.equal(sheets.Tasks[1][4], 0.2);
  assert.equal(sheets.Tasks[1][5], 1.2);
  assert.equal(sheets.Tasks[2][4], "DNR");
  assert.equal(sheets.Tasks[2][5], "DNR");
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
  assert.match(taskSheetXml, /<c r="E2" s="2"><v>0\.2<\/v><\/c>/);
  assert.match(
    taskSheetXml,
    /<c r="F3" t="inlineStr" s="2"><is><t xml:space="preserve">DNR<\/t><\/is><\/c>/,
  );
  assert.doesNotMatch(machineSheetXml, /Machine ID/);
  assert.match(machineSheetXml, /<c r="H2"><v>2<\/v><\/c>/);
});
