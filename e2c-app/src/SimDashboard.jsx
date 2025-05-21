import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SimDashboard = () => {
  const taskSlots = Array.from({ length: 6 });
  const queues = Array.from({ length: 3 });

  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarMode, setSidebarMode] = useState(null); // "workload", "loadBalancer", or "machine"
  const [selectedMachine, setSelectedMachine] = useState(null);

  const [scheduling, setScheduling] = useState("immediate");
  const [policy, setPolicy] = useState("Min-Expected-Execution-Time");
  const [queueSize, setQueueSize] = useState("unlimited");

  const [runtimeModel, setRuntimeModel] = useState("Constant");
  const [params, setParams] = useState({ mean: "", std: "", mean1: "", std1: "", mean2: "", std2: "" });

  const openSidebar = (mode, machine = null) => {
    setSidebarMode(mode);
    setSelectedMachine(machine);
    setShowSidebar(true);
  };

  const handleParamChange = (key, value) => {
    setParams({ ...params, [key]: value });
  };

  return (
    <div className="bg-[#d9d9d9] min-h-screen flex flex-col relative">
      {/* Main Simulation Area */}
      <div className="flex-grow flex flex-col justify-center items-center">
        <div className="w-[90%] max-w-7xl bg-[#eeeeee] p-6 rounded-xl shadow-xl flex flex-col items-center">
          <div className="flex justify-center items-end space-x-6">
            {/* Left Side */}
            <div className="flex flex-col items-center space-y-8">
              <div className="flex items-center space-x-4">
                <div
                  onClick={() => openSidebar("workload")}
                  className="bg-gray-800 text-white text-sm font-semibold w-20 h-20 flex items-center justify-center rounded-full cursor-pointer hover:scale-105 transition"
                >
                  Workload
                </div>

                <div className="flex space-x-2 px-3 py-2 border-4 border-black rounded-xl bg-white">
                  {taskSlots.map((_, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 bg-gray-300 rounded border border-gray-700"
                    ></div>
                  ))}
                </div>

                <div
                  onClick={() => openSidebar("loadBalancer")}
                  className="bg-gray-800 text-white text-sm font-semibold w-20 h-20 flex items-center justify-center rounded-full cursor-pointer hover:scale-105 transition text-center px-2"
                >
                  Load<br />Balancer
                </div>
              </div>

              <div className="text-gray-700 text-sm">Current Time 0.000</div>
              <div className="text-gray-700 text-sm mt-2">Cancelled Tasks</div>
            </div>

            {/* Right Side */}
            <div className="flex items-end space-x-6">
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="space-y-6">
                  {queues.map((_, row) => (
                    <div key={row} className="flex space-x-2">
                      {taskSlots.map((_, col) => (
                        <div
                          key={col}
                          className="w-10 h-10 bg-gray-300 rounded border border-gray-700"
                        ></div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center space-y-6">
                {["m1", "m2", "m3"].map((machine, index) => (
                  <div
                    key={machine}
                    onClick={() => openSidebar("machine", machine)}
                    className={`${
                      index === 1
                        ? "bg-green-500"
                        : index === 2
                        ? "bg-blue-600"
                        : "bg-blue-500"
                    } text-white font-semibold w-16 h-10 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition`}
                  >
                    {machine}
                  </div>
                ))}
                <div className="text-gray-700 text-sm pt-2">Missed Tasks</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#eeeeee] border-t border-gray-400 p-4 flex flex-col items-center space-y-4">
        <div className="flex justify-center items-center space-x-10">
          <img src="/logos/hpc.png" alt="HPC Lab" className="h-8 grayscale" />
          <img src="/logos/ul.png" alt="UL" className="h-8 grayscale" />
          <img src="/logos/nsf.png" alt="NSF" className="h-8 grayscale" />
        </div>

        <div className="flex space-x-6">
          <button className="bg-gray-400 rounded-xl w-16 h-10">⟲</button>
          <button className="bg-gray-400 rounded-xl w-16 h-10">▶</button>
          <button className="bg-gray-400 rounded-xl w-16 h-10">⏸</button>
        </div>

        <div className="w-full max-w-md flex justify-between items-center px-4">
          <span className="text-sm text-gray-700">progress</span>
          <span className="text-sm text-gray-700">speed</span>
        </div>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 p-6 border-l border-gray-300 flex flex-col overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {sidebarMode === "workload"
                  ? "Workload & Profiling Table"
                  : sidebarMode === "loadBalancer"
                  ? "Load Balancer"
                  : `Machine: ${selectedMachine?.toUpperCase()}`}
              </h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-xl text-gray-500 hover:text-black"
              >
                &times;
              </button>
            </div>

            {sidebarMode === "workload" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Profiling Table (.csv or .eet)
                  </label>
                  <input
                    type="file"
                    accept=".csv,.eet"
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Workload File (.json or .wkl)
                  </label>
                  <input
                    type="file"
                    accept=".json,.wkl"
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {sidebarMode === "loadBalancer" && (
              <form className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Scheduling</label>
                  <div className="space-y-1">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="scheduling"
                        checked={scheduling === "immediate"}
                        onChange={() => setScheduling("immediate")}
                      />
                      <span className="text-sm">Immediate Scheduling</span>
                    </label>

                    <select
                      value={policy}
                      onChange={(e) => setPolicy(e.target.value)}
                      className="w-full border px-3 py-2 text-sm rounded"
                    >
                      <option>FirstCome-FirstServe</option>
                      <option>Min-Expected-Completion-Time</option>
                      <option>Min-Expected-Execution-Time</option>
                      <option>Weighted-Round-Robin</option>
                    </select>

                    <label className="flex items-center space-x-2 mt-2">
                      <input
                        type="radio"
                        name="scheduling"
                        checked={scheduling === "batch"}
                        onChange={() => setScheduling("batch")}
                      />
                      <span className="text-sm">Batch Scheduling</span>
                    </label>

                    <select
                      disabled={scheduling !== "batch"}
                      className="w-full border px-3 py-2 text-sm rounded bg-gray-100 disabled:opacity-60"
                    >
                      <option>MinCompletion-MinCompletion</option>
                      <option>MinCompletion-SoonestDeadline</option>
                      <option>MinCompletion-MaxUrgency</option>
                      <option>FELARE</option>
                      <option>ELARE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Machine Queue Size
                  </label>
                  <input
                    type="text"
                    value={queueSize}
                    onChange={(e) => setQueueSize(e.target.value)}
                    disabled={scheduling === "batch"}
                    className="w-full border px-3 py-2 text-sm rounded bg-white disabled:bg-gray-100 disabled:opacity-60"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
                >
                  Submit
                </button>
              </form>
            )}

            {sidebarMode === "machine" && (
              <form className="space-y-6">

                {/* Runtime Model Parameters */}
                {runtimeModel === "Constant" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mean</label>
                    <input
                      type="text"
                      value={params.mean}
                      onChange={(e) => handleParamChange("mean", e.target.value)}
                      className="w-full border px-3 py-2 text-sm rounded"
                    />
                  </div>
                )}

                {runtimeModel === "Gaussian" && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Mean</label>
                      <input
                        type="text"
                        value={params.mean}
                        onChange={(e) => handleParamChange("mean", e.target.value)}
                        className="w-full border px-3 py-2 text-sm rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Standard Deviation</label>
                      <input
                        type="text"
                        value={params.std}
                        onChange={(e) => handleParamChange("std", e.target.value)}
                        className="w-full border px-3 py-2 text-sm rounded"
                      />
                    </div>
                  </div>
                )}

                {runtimeModel === "Bimodal" && (
                  <div className="space-y-2">
                    {["ID", "Power", "Queue Size"].map((key) => (
                      <div key={key}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          {key.toUpperCase()}
                        </label>
                        <input
                          type="text"
                          value={params[key]}
                          onChange={(e) => handleParamChange(key, e.target.value)}
                          className="w-full border px-3 py-2 text-sm rounded"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
                >
                  Submit
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimDashboard;
