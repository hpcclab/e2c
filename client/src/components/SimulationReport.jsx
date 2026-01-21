import React, { useState, useCallback, useEffect } from 'react';

const SimulationReport = ({ 
  dataResults, 
  simulationTime, 
  missedTasks, 
  onClose,
  onMinimize,
  onRunSimulation 
}) => {
  const [reportSize, setReportSize] = useState({ width: 800, height: 500 });
  const [reportPosition, setReportPosition] = useState({ x: 100, y: 100 });
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.classList.contains('report-header')) {
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX - reportPosition.x, 
        y: e.clientY - reportPosition.y 
      });
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setReportPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
    if (isResizing) {
      setReportSize({
        width: Math.max(400, e.clientX - reportPosition.x),
        height: Math.max(300, e.clientY - reportPosition.y)
      });
    }
  }, [isDragging, isResizing, dragStart, reportPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="absolute bg-white rounded-lg shadow-2xl z-20 flex flex-col"
      style={{
        left: `${reportPosition.x}px`,
        top: `${reportPosition.y}px`,
        width: `${reportSize.width}px`,
        height: `${reportSize.height}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header - Draggable */}
      <div className="report-header flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg cursor-move">
        <h2 className="text-lg font-semibold">Simulation Results</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={onMinimize}
            className="text-white hover:bg-blue-800 rounded px-2 py-1 transition"
          >
            Minimize
          </button>
          <button
            onClick={onClose}
            className="text-white hover:bg-red-600 rounded px-2 py-1 transition"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 text-center bg-blue-50 p-3 rounded">
          <h3 className="text-md font-semibold text-gray-700">
            Simulation Time: {simulationTime.toFixed(2)} seconds
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Total Tasks: {dataResults.length} | 
            Completed: {dataResults.filter(t => t.status === 'COMPLETED').length} | 
            Missed: {missedTasks.length}
          </p>
        </div>

        <table className="table-auto border-collapse border border-gray-400 w-full text-sm">
          <thead className="sticky top-0 bg-gray-200">
            <tr>
              <th className="border px-2 py-1">Task ID</th>
              <th className="border px-2 py-1">Task Type</th>
              <th className="border px-2 py-1">Machine ID</th>
              <th className="border px-2 py-1">Assigned Machine</th>
              <th className="border px-2 py-1">Arrival Time</th>
              <th className="border px-2 py-1">Start</th>
              <th className="border px-2 py-1">End</th>
              <th className="border px-2 py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {dataResults.map((task) => (
              <tr key={task.taskId} className={task.status === 'CANCELLED' ? 'bg-red-50' : ''}>
                <td className="border px-2 py-1">{task.taskId}</td>
                <td className="border px-2 py-1">{task.task_type}</td>
                <td className="border px-2 py-1">{task.machineId ?? "N/A"}</td>
                <td className="border px-2 py-1">{task.assigned_machine ?? "N/A"}</td>
                <td className="border px-2 py-1">{task.arrival_time}</td>
                <td className="border px-2 py-1">{task.start ?? "-"}</td>
                <td className="border px-2 py-1">{task.end ?? "-"}</td>
                <td className="border px-2 py-1">
                  <span className={`px-2 py-1 rounded text-xs ${
                    task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    task.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {task.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsResizing(true);
        }}
      >
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
        </svg>
      </div>

      {/* Play Controls at Bottom */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex justify-center space-x-4">
          <button className="bg-gray-400 hover:bg-gray-500 text-white rounded-full w-10 h-10 flex items-center justify-center transition">
            ⟲
          </button>
          <button
            onClick={onRunSimulation}
            className="bg-green-600 hover:bg-green-700 text-white rounded-full w-10 h-10 flex items-center justify-center transition shadow-md"
          >
            ▶
          </button>
          <button className="bg-gray-400 hover:bg-gray-500 text-white rounded-full w-10 h-10 flex items-center justify-center transition">
            ⏸
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationReport;
