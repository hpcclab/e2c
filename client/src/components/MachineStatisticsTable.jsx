import React from "react";
import { formatUtilizationTime } from "../utils/formatTime";

const MachineStatisticsTable = ({ machines = [], tasksPerMachine = {} }) => {
  const machineList = machines.filter((machine) => machine.id !== -1);

  const taskCountFor = (machine, index) =>
    tasksPerMachine[`machine-${index + 1}`] ||
    tasksPerMachine[`machine-${machine.id}`] ||
    tasksPerMachine[machine.id] ||
    tasksPerMachine[machine.name] ||
    0;

  return (
    <div className="mt-6 border-t pt-4">
      <h4 className="mb-3 flex items-center text-lg font-bold text-gray-800">
        <svg
          className="mr-2 h-5 w-5 text-indigo-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
        Machine Statistics
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse border border-gray-300 text-sm shadow-sm">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                Machine
              </th>
              <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                Power (W)
              </th>
              <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                Price ($/s)
              </th>
              <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                Utilization
              </th>
              <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                Cost ($)
              </th>
              <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                Tasks
              </th>
            </tr>
          </thead>
          <tbody>
            {machineList.map((machine, index) => {
              const taskCount = taskCountFor(machine, index);
              const utilization = formatUtilizationTime(
                machine.utilization_time || 0,
              );
              const cost =
                (machine.price || 0) *
                (machine.utilization_time || 0) *
                3600;

              return (
                <tr
                  key={`machine-${machine.id}-${index}`}
                  className="hover:bg-gray-50"
                >
                  <td className="border border-gray-300 px-4 py-2 font-medium">
                    {machine.name}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {machine.power || 0} W
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    ${machine.price || 0}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {utilization.value} {utilization.unit}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    ${cost.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right font-semibold text-blue-700">
                    {taskCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gradient-to-r from-gray-200 to-gray-300 font-bold">
            <tr>
              <td className="border border-gray-300 px-4 py-2">Total</td>
              <td className="border border-gray-300 px-4 py-2 text-right">
                {machineList.reduce(
                  (sum, machine) => sum + (machine.power || 0),
                  0,
                )}{" "}
                W
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right">
                $
                {machineList
                  .reduce(
                    (sum, machine) => sum + (machine.price || 0),
                    0,
                  )
                  .toFixed(2)}
                /s
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right">
                {machineList
                  .reduce(
                    (sum, machine) => sum + (machine.utilization_time || 0),
                    0,
                  )
                  .toFixed(2)}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right text-green-800">
                $
                {machineList
                  .reduce(
                    (sum, machine) =>
                      sum +
                      (machine.price || 0) *
                        (machine.utilization_time || 0) *
                        3600,
                    0,
                  )
                  .toFixed(2)}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right font-semibold text-blue-700">
                {machineList.reduce(
                  (sum, machine, index) =>
                    sum + taskCountFor(machine, index),
                  0,
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default MachineStatisticsTable;
