import React from "react";

const SimDashboard = () => {
  const taskSlots = Array.from({ length: 6 });
  const queues = Array.from({ length: 3 });

  return (
    <div className="bg-[#d9d9d9] min-h-screen flex flex-col">
      {/* Main Simulation Area */}
      <div className="flex-grow flex flex-col justify-center items-center">
        <div className="w-[90%] max-w-7xl bg-[#eeeeee] p-6 rounded-xl shadow-xl flex flex-col items-center">
          {/* Simulation Body */}
          <div className="flex justify-center items-end space-x-6">
            {/* Left Side */}
            <div className="flex flex-col items-center space-y-8">
              <div className="flex items-center space-x-4">
                <div className="bg-gray-800 text-white text-sm font-semibold w-20 h-20 flex items-center justify-center rounded-full">
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

                <div className="bg-gray-800 text-white text-sm font-semibold w-20 h-20 flex items-center justify-center rounded-full text-center px-2">
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
                <div className="bg-blue-500 text-white font-semibold w-16 h-10 rounded-full flex items-center justify-center">m1</div>
                <div className="bg-pink-500 text-white font-semibold w-16 h-10 rounded-full flex items-center justify-center">m2</div>
                <div className="bg-yellow-400 text-white font-semibold w-16 h-10 rounded-full flex items-center justify-center">m3</div>
                <div className="text-gray-700 text-sm pt-2">Missed Tasks</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-[#eeeeee] border-t border-gray-400 p-4 flex flex-col items-center space-y-4">
        {/* Logos */}
        <div className="flex justify-center items-center space-x-10">
          <img src="/logos/hpc.png" alt="HPC Lab" className="h-8 grayscale" />
          <img src="/logos/ul.png" alt="UL" className="h-8 grayscale" />
          <img src="/logos/nsf.png" alt="NSF" className="h-8 grayscale" />
        </div>

        {/* Playback Controls */}
        <div className="flex space-x-6">
          <button className="bg-gray-400 rounded-xl w-16 h-10">⟲</button>
          <button className="bg-gray-400 rounded-xl w-16 h-10">▶</button>
          <button className="bg-gray-400 rounded-xl w-16 h-10">⏸</button>
        </div>

        {/* Progress + Speed Labels */}
        <div className="w-full max-w-md flex justify-between items-center px-4">
          <span className="text-sm text-gray-700">progress</span>
          <span className="text-sm text-gray-700">speed</span>
        </div>
      </div>
    </div>
  );
};

export default SimDashboard;
