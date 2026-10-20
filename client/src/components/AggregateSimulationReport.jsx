import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ErrorBar,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Collapsible from "./Collapsible";
import { formatEnergy } from "../utils/formatTime";
import { buildAggregateChartData } from "../utils/reportCharts";
import { buildSimulationBatchSummary } from "../utils/simulationBatch";

const SUMMARY_ROWS = [
  { label: "Tasks Unassigned", key: "unassigned", digits: 2 },
  { label: "Tasks In Progress", key: "inProgress", digits: 2 },
  { label: "Tasks Completed", key: "completed", digits: 2 },
  { label: "Tasks Missed", key: "missed", digits: 2 },
  { label: "Total Tasks", key: "totalTasks", digits: 2 },
  { label: "Total Machines", key: "totalMachines", digits: 2 },
  { label: "Total IoT Devices", key: "totalIotDevices", digits: 2 },
  { label: "Total Edges", key: "totalEdges", digits: 2 },
  {
    label: "Completion Rate",
    key: "completionRate",
    digits: 2,
    suffix: "%",
    rowClassName: "bg-blue-50",
    valueClassName: "font-semibold text-blue-700",
  },
  {
    label: "Total Energy Consumed",
    key: "totalEnergyJ",
    digits: 2,
    suffix: " J",
    rowClassName: "bg-yellow-50",
    valueClassName: "font-semibold text-yellow-700",
  },
  {
    label: "Total Cost",
    key: "totalCost",
    digits: 4,
    prefix: "$",
    rowClassName: "bg-green-50",
    valueClassName: "font-semibold text-green-700",
  },
];

const STATUS_COLORS = [
  "#22c55e",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#ec4899",
];

const formatMetric = (value, row) => {
  const numericValue = Number(value);
  const formatted = Number.isFinite(numericValue)
    ? numericValue.toFixed(row.digits)
    : "0.00";
  return `${row.prefix || ""}${formatted}${row.suffix || ""}`;
};

const taskExactFormatter = (value) => `${Number(value).toFixed(2)} tasks`;
const costExactFormatter = (value) => `$${Number(value).toFixed(4)}`;
const energyExactFormatter = (value) => {
  const formatted = formatEnergy(Number(value) || 0);
  return `${formatted.value} ${formatted.unit}`;
};

const AggregateTooltip = ({ active, payload, label, exactFormatter }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded border border-gray-200 bg-white p-3 text-sm shadow-lg">
      <p className="mb-1 font-semibold text-gray-900">{label}</p>
      <p className="text-blue-700">Mean: {row.percentage.toFixed(2)}%</p>
      <p className="text-blue-700">
        95% CI: ±{row.confidenceInterval95.toFixed(2)} percentage points
      </p>
      <p className="mt-2 text-gray-700">
        Exact mean: {exactFormatter(row.exactMean)}
      </p>
      <p className="text-gray-700">
        Exact 95% CI: ±{exactFormatter(row.exactConfidenceInterval95)}
      </p>
    </div>
  );
};

const AggregateBarChart = ({ data, title, exactFormatter }) => (
  <div className="rounded-lg border bg-white p-4">
    <h5 className="mb-3 text-center text-sm font-semibold text-gray-700">
      {title}
    </h5>
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
      >
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          content={<AggregateTooltip exactFormatter={exactFormatter} />}
        />
        <Bar
          dataKey="percentage"
          name="Mean percentage"
          fill="#2563eb"
          radius={[4, 4, 0, 0]}
        >
          <ErrorBar
            dataKey="confidenceInterval95Error"
            width={8}
            stroke="#1e3a8a"
            strokeWidth={2}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const AggregateSimulationReport = ({ entries = [] }) => {
  const summary = useMemo(
    () => buildSimulationBatchSummary(entries),
    [entries],
  );
  const chartData = useMemo(() => buildAggregateChartData(entries), [entries]);

  return (
    <section className="flex h-full w-full flex-col rounded-lg bg-white shadow-2xl">
      <div className="flex items-center justify-between rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
        <h2 className="text-lg font-semibold">Aggregate Simulation Results</h2>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 text-center shadow-sm">
          <h3 className="text-xl font-bold text-gray-800">
            {summary.completedRuns} Completed Simulations
          </h3>
          <p className="mt-1 text-sm font-semibold text-blue-800">
            {summary.completedRuns} of {summary.totalRuns} simulations included
          </p>
        </div>

        {summary.completedRuns === 0 ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center font-semibold text-blue-800">
            Aggregate statistics will appear after a simulation finishes.
          </div>
        ) : (
          <>
            <Collapsible title="Statistics Summary">
              <div className="mt-6 border-t pt-4">
                <h4 className="mb-4 flex items-center text-lg font-bold text-gray-800">
                  <svg
                    className="mr-2 h-5 w-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Statistics Summary
                </h4>

                <table className="mb-4 w-full table-auto border-collapse border border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Metric
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-right">
                        Mean
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-right">
                        Standard Deviation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {SUMMARY_ROWS.map((row) => (
                      <tr
                        key={row.key}
                        className={`${row.rowClassName || ""} hover:bg-gray-50`}
                      >
                        <td className="border border-gray-300 px-4 py-2 font-medium">
                          {row.label}
                        </td>
                        <td
                          className={`border border-gray-300 px-4 py-2 text-right ${row.valueClassName || ""}`}
                        >
                          {formatMetric(summary.averages[row.key], row)}
                        </td>
                        <td
                          className={`border border-gray-300 px-4 py-2 text-right ${row.valueClassName || ""}`}
                        >
                          {formatMetric(
                            summary.standardDeviations[row.key],
                            row,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="text-sm text-gray-600">
                  Standard deviation is the sample standard deviation across
                  completed simulations.
                </p>
              </div>
            </Collapsible>

            <Collapsible title="Charts & Visualizations">
              <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-lg border bg-white p-4">
                  <h5 className="mb-3 text-center text-sm font-semibold text-gray-700">
                    Average Task Status Breakdown
                  </h5>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={chartData.taskStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="percentage"
                        label={({ name, value }) =>
                          `${name} ${Number(value).toFixed(0)}%`
                        }
                      >
                        {chartData.taskStatus.map((row, index) => (
                          <Cell
                            key={row.name}
                            fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(percentage, _name, item) => [
                          `${Number(percentage).toFixed(2)}% (${item.payload.exactMean.toFixed(2)} tasks average)`,
                          item.payload.name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <AggregateBarChart
                  data={chartData.taskCounts}
                  title="Average Tasks per Machine (95% CI)"
                  exactFormatter={taskExactFormatter}
                />
                <AggregateBarChart
                  data={chartData.energy}
                  title="Average Energy Consumption per Machine (95% CI)"
                  exactFormatter={energyExactFormatter}
                />
                <AggregateBarChart
                  data={chartData.cost}
                  title="Average Cost per Machine (95% CI)"
                  exactFormatter={costExactFormatter}
                />
                {chartData.missedByType.length > 0 && (
                  <AggregateBarChart
                    data={chartData.missedByType}
                    title="Average Missed Tasks by Type (95% CI)"
                    exactFormatter={taskExactFormatter}
                  />
                )}
              </div>
            </Collapsible>
          </>
        )}
      </div>
    </section>
  );
};

export default AggregateSimulationReport;
