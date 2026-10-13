import React from "react";
import { batteryPercentage } from "../utils/energy";

export default function BatteryIndicator({ device, className = "" }) {
  const percentage = batteryPercentage(device);
  if (percentage === null) return null;

  const rounded = Math.round(percentage);
  const fillColor =
    percentage > 50 ? "#16a34a" : percentage > 20 ? "#d97706" : "#dc2626";

  return (
    <div
      className={`flex items-center justify-center gap-1 ${className}`}
      title={`Battery: ${rounded}%`}
      aria-label={`Battery ${rounded} percent`}
    >
      <span className="relative inline-flex items-center">
        <span className="relative block h-3.5 w-7 overflow-hidden rounded-[3px] border-2 border-gray-600 bg-white">
          <span
            className="absolute inset-y-0 left-0 transition-all duration-300"
            style={{ width: `${percentage}%`, backgroundColor: fillColor }}
          />
        </span>
        <span className="block h-1.5 w-1 rounded-r-sm bg-gray-600" />
      </span>
      <span className="text-[10px] font-bold tabular-nums text-gray-700">
        {rounded}%
      </span>
    </div>
  );
}
