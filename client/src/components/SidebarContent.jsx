import React from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import DataTable from "./components/DataTable";

export const WorkloadSidebar = ({
  profilingFileUploaded,
  profilingFileName,
  profilingTableData,
  workloadFileUploaded,
  workloadFileName,
  workloadTableData,
  configFileUploaded,
  configFileName,
  handleProfilingUpload,
  handleWorkloadUpload,
  handleConfigUpload,
  handleSubmitWorkloadAndProfiling,
  handleResetWorkload,
  workloadSubmissionStatus,
  setProfilingFileName,
  setProfilingFileUploaded,
  setProfilingTableData,
  setWorkloadFileName,
  setWorkloadFileUploaded,
  setWorkloadTableData,
  setConfigFileName,
  setConfigFileUploaded,
  selectedTask, // Add selectedTask for task details display
}) => (
  <div className="space-y-6">
    {/* Task Details */}
    {selectedTask && selectedTask.id !== -1 && (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Task Details
        </label>
        <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
          <tbody>
            <tr>
              <td className="border px-2 py-1 font-semibold">Task ID</td>
              <td className="border px-2 py-1">{selectedTask.id}</td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-semibold">Type</td>
              <td className="border px-2 py-1">{selectedTask.task_type}</td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-semibold">Arrival Time</td>
              <td className="border px-2 py-1">{selectedTask.arrival_time}</td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-semibold">Deadline</td>
              <td className="border px-2 py-1">{selectedTask.deadline}</td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-semibold">Machine Type</td>
              <td className="border px-2 py-1">
                {selectedTask.assigned_machine?.type?.name || "No Machine Assigned"}
              </td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-semibold">Status</td>
              <td className="border px-2 py-1">{selectedTask.status}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )}

    {/* Profiling Table Upload */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        Profiling Table (.eet)
      </label>
      {!profilingFileUploaded && (
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          <label className="cursor-pointer">
            Choose File
            <input
              type="file"
              accept=".eet"
              className="hidden"
              onChange={handleProfilingUpload}
            />
          </label>
        </button>
      )}
      {profilingFileName && (
        <div className="flex flex-col space-y-2 mt-2">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-600">Uploaded File: {profilingFileName}</p>
            <button
              className="text-red-600 hover:text-red-800 transition"
              onClick={() => {
                setProfilingFileName("");
                setProfilingFileUploaded(false);
                setProfilingTableData([]);
              }}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
          {profilingTableData.length > 0 && (
            <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
              <thead>
                <tr>
                  {Object.keys(profilingTableData[0]).map((header) => (
                    <th key={header} className="border border-gray-300 px-4 py-2 bg-gray-100">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profilingTableData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, idx) => (
                      <td key={idx} className="border border-gray-300 px-4 py-2">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>

    {/* Workload File Upload */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        Workload File (.wkl)
      </label>
      {!workloadFileUploaded && (
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          <label className="cursor-pointer">
            Choose File
            <input
              type="file"
              accept=".wkl"
              className="hidden"
              onChange={handleWorkloadUpload}
            />
          </label>
        </button>
      )}
      {workloadFileName && (
        <div className="flex flex-col space-y-2 mt-2">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-600">Uploaded File: {workloadFileName}</p>
            <button
              className="text-red-600 hover:text-red-800 transition"
              onClick={() => {
                setWorkloadFileName("");
                setWorkloadFileUploaded(false);
                setWorkloadTableData([]);
              }}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
          {workloadTableData.length > 0 && (
            <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
              <thead>
                <tr>
                  {Object.keys(workloadTableData[0]).map((header) => (
                    <th key={header} className="border border-gray-300 px-4 py-2 bg-gray-100">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workloadTableData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, idx) => (
                      <td key={idx} className="border border-gray-300 px-4 py-2">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>

    {/* Config File Upload */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        Load Configuration File (.json)
      </label>
      {!configFileUploaded && (
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          <label className="cursor-pointer">
            Choose File
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleConfigUpload}
            />
          </label>
        </button>
      )}
      {configFileName && (
        <div className="flex items-center space-x-2 mt-2">
          <p className="text-sm text-gray-600">Uploaded File: {configFileName}</p>
          <button
            className="text-red-600 hover:text-red-800 transition"
            onClick={() => {
              setConfigFileName("");
              setConfigFileUploaded(false);
            }}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>

    {/* Submit and Reset Buttons */}
    <div className="space-y-4">
      <button
        onClick={handleSubmitWorkloadAndProfiling}
        className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
      >
        Submit Workload and Profiling Table
      </button>
      <button
        onClick={handleResetWorkload}
        className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
      >
        Generate New Workload
      </button>

      {/* Success Message */}
      {workloadSubmissionStatus && (
        <p className="text-sm text-center text-green-600 mt-2">{workloadSubmissionStatus}</p>
      )}
    </div>
  </div>
);
