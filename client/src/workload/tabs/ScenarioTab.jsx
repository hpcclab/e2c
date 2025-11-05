import React, { useState } from "react";
import { TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import seedrandom from "seedrandom";

const distributionOptions = ["uniform", "normal", "exponential", "spiky"];

function sampleArrivalTimes(start, end, n, dist, seed = 100) {
  let arr = [];
  let rng = seedrandom(seed);
  if (dist === "uniform") {
    for (let i = 0; i < n; i++) {
      arr.push(Number((start + (end - start) * rng()).toFixed(2)));
    }
  } else if (dist === "normal") {
    let mean = (start + end) / 2;
    let stddev = (end - start) / 6;
    for (let i = 0; i < n; i++) {
      let u = rng();
      let v = rng();
      let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      let t = mean + stddev * z;
      t = Math.max(start, Math.min(end, t));
      arr.push(Number(t.toFixed(2)));
    }
  } else if (dist === "exponential") {
    let lambda = n / (end - start);
    let time = start;
    for (let i = 0; i < n; i++) {
      let u = rng();
      let interval = -Math.log(1 - u) / lambda;
      time += interval;
      if (time > end) time = end;
      arr.push(Number(time.toFixed(2)));
    }
  } else if (dist === "spiky") {
    let spikes = Math.max(1, Math.floor(n / 10));
    for (let s = 0; s < spikes; s++) {
      let spikeTime = start + (end - start) * rng();
      let spikeSize = Math.max(1, Math.floor(n / spikes));
      for (let i = 0; i < spikeSize; i++) {
        let t = spikeTime + ((rng() - 0.5) * (end - start) / 20);
        t = Math.max(start, Math.min(end, t));
        arr.push(Number(t.toFixed(2)));
      }
    }
    arr = arr.slice(0, n);
  } else {
    for (let i = 0; i < n; i++) {
      arr.push(Number((start + (end - start) * rng()).toFixed(2)));
    }
  }
  arr.sort((a, b) => a - b);
  return arr;
}

function getDataSizes(mean, stdv, num_of_tasks) {
  const sizes = [];
  for (let i = 0; i < num_of_tasks; i++) {
    let u = Math.random();
    let v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    let sample = mean + stdv * z;
    sizes.push(Number(sample.toFixed(2)));
  }
  return sizes;
}

function generateWorkload(scenarioRows, taskTypes, seedOffset = 0) {
  let workload = [];
  scenarioRows.forEach((row, idx) => {
    const sample = sampleArrivalTimes(
      Number(row.startTime),
      Number(row.endTime),
      Number(row.numTasks),
      row.distribution,
      100 + 10 * idx + seedOffset // unique seed for each file
    );
    const typeObj = (taskTypes || []).find(t => t.name === row.taskType);
    const meanSize = Number(typeObj?.meanSize || 100);
    const stdv = Number(typeObj?.stdv || 20);
    const dataSizes = getDataSizes(meanSize, stdv, sample.length);

    sample.forEach((arrival_time, i) => {
      workload.push({
        task_type: row.taskType,
        arrival_time,
        distribution: row.distribution,
        data_size: dataSizes[i]
      });
    });
  });
  workload.sort((a, b) => a.arrival_time - b.arrival_time);
  return workload;
}

const ScenarioTab = ({
  scenarioRows = [],
  setScenarioRows,
  setActiveTab,
  setWorkloadFiles,
  setSelectedWorkloadIdx,
  taskTypes
}) => {
  const initialTaskType = taskTypes && taskTypes.length > 0
    ? (taskTypes[0].name || taskTypes[0])
    : "";

  const [newTaskType, setNewTaskType] = useState(initialTaskType);
  const [newNumTasks, setNewNumTasks] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newDistribution, setNewDistribution] = useState(distributionOptions[0]);
  const [numWorkloads, setNumWorkloads] = useState(1);

  // Edit logic
  const [editIdx, setEditIdx] = useState(null);
  const [editRow, setEditRow] = useState({});

  const addScenarioRow = () => {
    if (!newNumTasks || !newStartTime || !newEndTime) return;
    setScenarioRows([
      ...scenarioRows,
      {
        taskType: newTaskType,
        numTasks: newNumTasks,
        startTime: newStartTime,
        endTime: newEndTime,
        distribution: newDistribution,
      },
    ]);
    setNewTaskType(initialTaskType);
    setNewNumTasks("");
    setNewStartTime("");
    setNewEndTime("");
    setNewDistribution(distributionOptions[0]);
  };

  const removeScenarioRow = idx => {
    setScenarioRows(scenarioRows.filter((_, i) => i !== idx));
  };

  const startEdit = (idx) => {
    setEditIdx(idx);
    setEditRow(scenarioRows[idx]);
  };

  const cancelEdit = () => {
    setEditIdx(null);
    setEditRow({});
  };

  const saveEdit = () => {
    setScenarioRows(scenarioRows.map((row, idx) => idx === editIdx ? editRow : row));
    setEditIdx(null);
    setEditRow({});
  };

  const handleEditChange = (field, value) => {
    setEditRow({ ...editRow, [field]: value });
  };

  // Generate multiple workloads and store them in parent state
  const handleGenerateMultipleWorkloads = () => {
    const allWorkloads = [];
    for (let i = 1; i <= numWorkloads; i++) {
      const workload = generateWorkload(scenarioRows, taskTypes, i * 1000);
      allWorkloads.push(workload);
    }
    setWorkloadFiles(allWorkloads);
    setSelectedWorkloadIdx(0); // Preview the first one by default
    setActiveTab("workload");
  };

  return (
    <div className="space-y-6">
      {/* Preview Table */}
      <div className="mt-6">
        <table className="min-w-full border border-gray-300 rounded text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">Task Type</th>
              <th className="border px-2 py-1"># Tasks</th>
              <th className="border px-2 py-1">Start Time</th>
              <th className="border px-2 py-1">End Time</th>
              <th className="border px-2 py-1">Distribution</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scenarioRows.length === 0 ? (
              <tr>
                <td className="border px-2 py-1 text-center text-gray-400" colSpan={6}>-</td>
              </tr>
            ) : (
              scenarioRows.map((row, idx) => (
                <tr key={idx}>
                  {editIdx === idx ? (
                    <>
                      <td className="border px-2 py-1">
                        <select
                          value={editRow.taskType}
                          onChange={e => handleEditChange("taskType", e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                        >
                          {(taskTypes || []).map((type, i) => (
                            <option key={i} value={type.name || type}>
                              {type.name || type}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          value={editRow.numTasks}
                          onChange={e => handleEditChange("numTasks", e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                          min={1}
                        />
                      </td>
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          value={editRow.startTime}
                          onChange={e => handleEditChange("startTime", e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                          min={0}
                        />
                      </td>
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          value={editRow.endTime}
                          onChange={e => handleEditChange("endTime", e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                          min={0}
                        />
                      </td>
                      <td className="border px-2 py-1">
                        <select
                          value={editRow.distribution}
                          onChange={e => handleEditChange("distribution", e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                        >
                          {distributionOptions.map((dist, i) => (
                            <option key={i} value={dist}>{dist}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border px-2 py-1 flex gap-2">
                        <button onClick={saveEdit} title="Save">
                          <CheckIcon className="w-5 h-5 text-green-600" />
                        </button>
                        <button onClick={cancelEdit} title="Cancel">
                          <XMarkIcon className="w-5 h-5 text-gray-500" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border px-2 py-1">{row.taskType}</td>
                      <td className="border px-2 py-1">{row.numTasks}</td>
                      <td className="border px-2 py-1">{row.startTime}</td>
                      <td className="border px-2 py-1">{row.endTime}</td>
                      <td className="border px-2 py-1">{row.distribution}</td>
                      <td className="border px-2 py-1 flex gap-2">
                        <button
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => startEdit(idx)}
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeScenarioRow(idx)}
                          title="Remove"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Add Scenario Row Section */}
        <div className="bg-gray-50 p-4 rounded shadow flex flex-col gap-3 mt-8">
          <h3 className="font-semibold text-lg text-gray-700 mb-2">Add Scenario Row</h3>
          <select
            value={newTaskType}
            onChange={e => setNewTaskType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {(taskTypes || []).map((type, idx) => (
              <option key={idx} value={type.name || type}>
                {type.name || type}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="# Tasks"
            value={newNumTasks}
            onChange={e => setNewNumTasks(e.target.value)}
            className="border rounded px-3 py-2"
            min={1}
          />
          <input
            type="number"
            placeholder="Start Time"
            value={newStartTime}
            onChange={e => setNewStartTime(e.target.value)}
            className="border rounded px-3 py-2"
            min={0}
          />
          <input
            type="number"
            placeholder="End Time"
            value={newEndTime}
            onChange={e => setNewEndTime(e.target.value)}
            className="border rounded px-3 py-2"
            min={0}
          />
          <select
            value={newDistribution}
            onChange={e => setNewDistribution(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {distributionOptions.map((dist, idx) => (
              <option key={idx} value={dist}>{dist}</option>
            ))}
          </select>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
            onClick={addScenarioRow}
          >
            Add Scenario Row
          </button>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              min={1}
              value={numWorkloads}
              onChange={e => setNumWorkloads(Number(e.target.value))}
              className="border rounded px-3 py-2 w-24"
              placeholder="Files"
            />
            <span className="text-gray-700"># Workload Files</span>
          </div>
          <button
            className="bg-yellow-600 text-white px-4 py-2 rounded mt-2 self-end"
            onClick={handleGenerateMultipleWorkloads}
          >
            Generate Workload(s)
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded mt-2 self-end"
            onClick={() => setActiveTab && setActiveTab("workload")}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScenarioTab;