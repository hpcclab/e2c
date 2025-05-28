import React, { useState } from "react";

const WorkloadGenerator = () => {
  const [scenario, setScenario] = useState("");
  const [numTasks, setNumTasks] = useState(3);
  const [taskType, setTaskType] = useState("Type A");
  const [eet, setEET] = useState([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ]);

  const taskTypes = ["Type A", "Type B", "Type C"];

  const handleEETChange = (row, col, value) => {
    const updated = [...eet];
    updated[row][col] = value;
    setEET(updated);
  };

  const handleReset = () => {
    setScenario("");
    setNumTasks(3);
    setTaskType("Type A");
    setEET([
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ]);
  };

  const handleGenerate = () => {
    alert("Workload generated (stub)");
  };

  const handleSubmit = () => {
    console.log({
      scenario,
      numTasks,
      taskType,
      eet,
    });
    alert("Submitted to backend (stub)");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start p-8">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-8 space-y-8">
        <h2 className="text-3xl font-bold text-gray-800">Workload Generator</h2>

        {/* Scenario Config */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Scenario Name</label>
            <input
              type="text"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Number of Tasks</label>
            <input
              type="number"
              min={1}
              value={numTasks}
              onChange={(e) => setNumTasks(Number(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        {/* Task Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Task Type</label>
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          >
            {taskTypes.map((type, i) => (
              <option key={i} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* EET Table */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">EET Table</label>
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="border px-4 py-2">Task ↓ / Machine →</th>
                  <th className="border px-4 py-2">M1</th>
                  <th className="border px-4 py-2">M2</th>
                  <th className="border px-4 py-2">M3</th>
                </tr>
              </thead>
              <tbody>
                {eet.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="border px-4 py-2 font-medium text-gray-600">Task {rIdx + 1}</td>
                    {row.map((val, cIdx) => (
                      <td key={cIdx} className="border px-2 py-1">
                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            handleEETChange(rIdx, cIdx, e.target.value)
                          }
                          className="w-full border rounded px-1 py-0.5 text-center"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleReset}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
          >
            Reset
          </button>
          <button
            onClick={handleGenerate}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Generate
          </button>
          <button
            onClick={handleSubmit}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkloadGenerator;
