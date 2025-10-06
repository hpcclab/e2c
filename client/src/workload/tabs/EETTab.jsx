import React from "react";

const EETTab = ({ eet, setEET, taskTypes = [], machineTypes = [] }) => {
  const updateCell = (rIdx, cIdx, value) => {
    const updated = eet.map(row => [...row]);
    if (!updated[rIdx]) updated[rIdx] = [];
    updated[rIdx][cIdx] = value;
    setEET(updated);
  };

  // Save EET table as CSV
  const handleSaveCSV = () => {
    let csv = "task_type," + machineTypes.map(m => typeof m === "object" ? m.name : m).join(",") + "\n";
    taskTypes.forEach((task, rIdx) => {
      const taskName = typeof task === "object" ? task.name : task;
      // Only take as many values as there are machine types
      const row = (eet[rIdx] || []).slice(0, machineTypes.length);
      csv += `${taskName || ""},${row.map(val => val || "").join(",")}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my_eet.csv.eet";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">EET Table</label>
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="border px-4 py-2">Task ↓ / Machine →</th>
              {machineTypes.map((m, i) => (
                <th key={i} className="border px-4 py-2">{typeof m === "object" ? m.name : m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {taskTypes.map((task, rIdx) => (
              <tr key={rIdx}>
                <td className="border px-4 py-2 font-medium text-gray-600">
                  {typeof task === "object" ? task.name : task}
                </td>
                {machineTypes.map((_, cIdx) => (
                  <td key={cIdx} className="border px-2 py-1">
                    <input
                      type="text"
                      value={eet[rIdx]?.[cIdx] || ""}
                      onChange={e => updateCell(rIdx, cIdx, e.target.value)}
                      className="w-full border rounded px-1 py-0.5 text-center"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
        onClick={handleSaveCSV}
      >
        Save EET as CSV
      </button>
    </div>
  );
};

export default EETTab;