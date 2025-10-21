import React, { useState } from "react";
import JSZip from 'jszip';

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
  const [isDownloading, setIsDownloading] = useState(false);
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

  const handleDownloadAllAsZip = async () => {
    if (workloadFiles.length === 0) return;

    setIsDownloading(true);
    
    try {
      const zip = new JSZip();
      
      // Create metadata file
      const metadata = {
        created_at: new Date().toISOString(),
        total_files: workloadFiles.length,
        file_info: workloadFiles.map((workload, index) => ({
          filename: `workload_${index + 1}.csv`,
          task_count: workload.length,
          task_types: [...new Set(workload.map(task => task.task_type))],
          duration_range: {
            min: Math.min(...workload.map(task => parseFloat(task.arrival_time))),
            max: Math.max(...workload.map(task => parseFloat(task.arrival_time)))
          }
        }))
      };
      
      // Add metadata to ZIP
      zip.file("metadata.json", JSON.stringify(metadata, null, 2));
      
      // Add each workload file to ZIP
      workloadFiles.forEach((workload, index) => {
        const csvContent = workloadToCSV(workload);
        zip.file(`workload_${index + 1}.csv`, csvContent);
      });

      // Generate and download ZIP
      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `workload_batch_${workloadFiles.length}_files_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error creating ZIP file:", error);
      alert("Failed to create ZIP file. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getTotalTasks = () => {
    return workloadFiles.reduce((total, workload) => total + workload.length, 0);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Workload Preview</label>
      
      {/* Bulk Download Section */}
      {workloadFiles.length > 1 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Bulk Download</h3>
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">
              <span className="font-medium">{workloadFiles.length}</span> files, 
              <span className="font-medium ml-1">{getTotalTasks()}</span> total tasks
            </div>
            <button
              className={`px-4 py-2 rounded text-white font-medium ${
                isDownloading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              onClick={handleDownloadAllAsZip}
              disabled={workloadFiles.length === 0 || isDownloading}
            >
              {isDownloading ? 'Creating ZIP...' : `Download All as ZIP`}
            </button>
          </div>
        </div>
      )}

      {/* Individual File Selection */}
      {workloadFiles.length > 1 && (
        <div className="mb-4">
          <label className="mr-2 text-sm font-medium">Select Workload:</label>
          <select
            value={selectedWorkloadIdx}
            onChange={e => setSelectedWorkloadIdx(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {workloadFiles.map((workload, idx) => (
              <option key={idx} value={idx}>
                Workload {idx + 1} ({workload.length} tasks)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Individual Download */}
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
        onClick={handleDownloadCSV}
        disabled={workloadTableData.length === 0}
      >
        Download Current as CSV
      </button>

      {/* Preview Table */}
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