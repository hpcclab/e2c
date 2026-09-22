import JSZip from "jszip";
import { downloadBlob } from "./downloadBlob.js";

const EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const normalizeStatus = (status) => String(status || "").toUpperCase();

const getTaskTime = (task, key) => {
  if (normalizeStatus(task.status) === "DNR") return "DNR";
  const value = task[key];
  return value === null || value === undefined ? "N/A" : value;
};

const getTaskId = (task) => task.taskId ?? task.id ?? "N/A";

const getMachineTaskCount = (machine, tasks) =>
  tasks.filter((task) => {
    const assignedMachine = task.assigned_machine || "";
    return (
      assignedMachine === machine.name ||
      assignedMachine.startsWith(`${machine.name} #`)
    );
  }).length;

export const buildExcelReportData = ({
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

  return {
    Summary: [
      ["Metric", "Value"],
      ["Simulation Time (s)", Number(simulationTime) || 0],
      ["Total Tasks", dataResults.length],
      ["Completed Tasks", completedTasks],
      ["Missed Tasks", missedTasks.length],
      ["Total Machines", machineList.length],
      ["Total Cost ($)", totalCost],
    ],
    Tasks: [
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
    "Missed Tasks": [
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
    Machines: [
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
};

const escapeXml = (value) =>
  String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const columnName = (columnNumber) => {
  let name = "";
  let current = columnNumber;
  while (current > 0) {
    current -= 1;
    name = String.fromCharCode(65 + (current % 26)) + name;
    current = Math.floor(current / 26);
  }
  return name;
};

const columnStyles = {
  Tasks: { 4: 2, 5: 2, 6: 2, 7: 2, 9: 2 },
  "Missed Tasks": { 4: 2, 5: 2 },
  Machines: { 5: 3, 6: 4, 7: 5 },
};

const getStyleId = (sheetName, rowNumber, columnNumber) => {
  if (rowNumber === 1) return 1;
  if (sheetName === "Summary" && columnNumber === 2) {
    if (rowNumber === 2) return 2;
    if (rowNumber === 7) return 5;
  }
  return columnStyles[sheetName]?.[columnNumber];
};

const cellXml = (value, reference, styleId) => {
  const style = styleId ? ` s="${styleId}"` : "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${reference}"${style}><v>${value}</v></c>`;
  }
  return `<c r="${reference}" t="inlineStr"${style}><is><t xml:space="preserve">${escapeXml(value ?? "")}</t></is></c>`;
};

const worksheetXml = (sheetName, rows) => {
  const columnCount = Math.max(1, ...rows.map((row) => row.length));
  const rowCount = Math.max(1, rows.length);
  const lastCell = `${columnName(columnCount)}${rowCount}`;
  const widths = Array.from({ length: columnCount }, (_, columnIndex) => {
    const maxLength = rows.reduce(
      (max, row) => Math.max(max, String(row[columnIndex] ?? "").length),
      10,
    );
    return Math.min(maxLength + 2, 32);
  });
  const columns = widths
    .map(
      (width, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
    )
    .join("");
  const sheetRows = rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cells = row
        .map((value, columnIndex) => {
          const columnNumber = columnIndex + 1;
          const reference = `${columnName(columnNumber)}${rowNumber}`;
          const styleId = getStyleId(sheetName, rowNumber, columnNumber);
          return cellXml(value, reference, styleId);
        })
        .join("");
      const height = rowNumber === 1 ? ' ht="24" customHeight="1"' : "";
      return `<row r="${rowNumber}"${height}>${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastCell}"/>
  <sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${columns}</cols>
  <sheetData>${sheetRows}</sheetData>
  <autoFilter ref="A1:${columnName(columnCount)}${rowCount}"/>
</worksheet>`;
};

const workbookXml = (sheetNames) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView/></bookViews>
  <sheets>${sheetNames
    .map(
      (name, index) =>
        `<sheet name="${escapeXml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
    )
    .join("")}</sheets>
</workbook>`;

const workbookRelationshipsXml = (sheetCount) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${Array.from(
    { length: sheetCount },
    (_, index) =>
      `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  ).join("")}
  <Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const contentTypesXml = (sheetCount) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${Array.from(
    { length: sheetCount },
    (_, index) =>
      `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join("")}
</Types>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="4">
    <numFmt numFmtId="164" formatCode="0.000"/>
    <numFmt numFmtId="165" formatCode="$0.0000"/>
    <numFmt numFmtId="166" formatCode="0.0000"/>
    <numFmt numFmtId="167" formatCode="$0.00"/>
  </numFmts>
  <fonts count="2">
    <font><sz val="10"/><name val="Arial"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Arial"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFD1D5DB"/></left><right style="thin"><color rgb="FFD1D5DB"/></right><top style="thin"><color rgb="FFD1D5DB"/></top><bottom style="thin"><color rgb="FFD1D5DB"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="6">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="167" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

export const createSimulationWorkbook = (reportData) => {
  const sheets = buildExcelReportData(reportData);
  const sheetNames = Object.keys(sheets);
  const zip = new JSZip();

  zip.file("[Content_Types].xml", contentTypesXml(sheetNames.length));
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  );
  zip.file("xl/workbook.xml", workbookXml(sheetNames));
  zip.file(
    "xl/_rels/workbook.xml.rels",
    workbookRelationshipsXml(sheetNames.length),
  );
  zip.file("xl/styles.xml", stylesXml);
  sheetNames.forEach((sheetName, index) => {
    zip.file(
      `xl/worksheets/sheet${index + 1}.xml`,
      worksheetXml(sheetName, sheets[sheetName]),
    );
  });

  return zip;
};

export const createExcelReportFile = async (reportData) => {
  const workbook = createSimulationWorkbook(reportData);
  const blob = await workbook.generateAsync({
    type: "blob",
    mimeType: EXCEL_MIME_TYPE,
    compression: "DEFLATE",
  });
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");

  return {
    blob,
    filename: `simulation_report_${timestamp}.xlsx`,
  };
};

export const exportExcelReport = async (reportData) => {
  const { blob, filename } = await createExcelReportFile(reportData);
  downloadBlob(blob, filename);
};
