import React from "react";

function getDuration(distribution) {
  switch (distribution) {
    case "uniform": return 10;
    case "normal": return 12;
    case "exponential": return 15;
    case "spiky": return 8;
    default: return 10;
  }
}

function workloadToCSV(workload) {
  const header = ["task_type", "arrival_time", "distribution", "data_size"];
  const rows = workload.map(row =>
    [row.task_type, row.arrival_time, row.distribution, row.data_size].join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

const WorkloadPreviewTab = ({
  workloadFiles = [],
  selectedWorkloadIdx = 0,
  setSelectedWorkloadIdx
}) => {
  const workloadTableData = workloadFiles[selectedWorkloadIdx] || [];

  const handleDownloadCSV = () => {
    const csvContent = workloadToCSV(workloadTableData);
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workload_${selectedWorkloadIdx + 1}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Workload Preview</label>
      {workloadFiles.length > 1 && (
        <div className="mb-4">
          <label className="mr-2">Select Workload:</label>
          <select
            value={selectedWorkloadIdx}
            onChange={e => setSelectedWorkloadIdx(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {workloadFiles.map((_, idx) => (
              <option key={idx} value={idx}>
                Workload {idx + 1}
              </option>
            ))}
          </select>
        </div>
      )}
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        onClick={handleDownloadCSV}
        disabled={workloadTableData.length === 0}
      >
        Download as CSV
      </button>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded text-xs">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">#</th>
              <th className="border px-2 py-1">Task Type</th>
              <th className="border px-2 py-1">Data Size (KB)</th>
              <th className="border px-2 py-1">Arrival Time</th>
              <th className="border px-2 py-1">Deadline</th>
            </tr>
          </thead>
          <tbody>
            {workloadTableData.length === 0 ? (
              <tr>
                <td className="border px-2 py-1 text-center text-gray-400" colSpan={5}>
                  No workload generated
                </td>
              </tr>
            ) : (
              workloadTableData.map((row, idx) => {
                const duration = getDuration(row.distribution);
                const deadline = Number(row.arrival_time) + duration;
                return (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{idx + 1}</td>
                    <td className="border px-2 py-1">{row.task_type}</td>
                    <td className="border px-2 py-1">{row.data_size}</td>
                    <td className="border px-2 py-1">{row.arrival_time}</td>
                    <td className="border px-2 py-1">{deadline}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkloadPreviewTab;