import React, { useState, useEffect, useRef } from "react";
import { IOT_ICON_MAP } from "../utils/iotIcons";
import { colorMemory } from "./Task";
import { useGlobalState } from "../context/GlobalStates";

const IOT_PRESETS = [
  { name: "Camera", icon: "MdVideocam" },
  { name: "Thermostat", icon: "MdThermostat" },
  { name: "Smart Bulb", icon: "MdLightbulb" },
  { name: "Smart Lock", icon: "MdLock" },
  { name: "Smart Speaker", icon: "MdSpeaker" },
  { name: "Smartphone", icon: "MdSmartphone" },
  { name: "Smart TV", icon: "MdTv" },
  { name: "Vehicle Sensor", icon: "MdDirectionsCar" },
];

const PALETTE = [
  { name: "Slate", bg: "#334155", text: "#e2e8f0", accent: "#94a3b8" },
  { name: "Sky", bg: "#0369a1", text: "#e0f2fe", accent: "#7dd3fc" },
  { name: "Teal", bg: "#0f766e", text: "#ccfbf1", accent: "#5eead4" },
  { name: "Emerald", bg: "#166534", text: "#dcfce7", accent: "#86efac" },
  { name: "Violet", bg: "#5b21b6", text: "#ede9fe", accent: "#c4b5fd" },
  { name: "Rose", bg: "#9f1239", text: "#ffe4e6", accent: "#fda4af" },
  { name: "Amber", bg: "#92400e", text: "#fef3c7", accent: "#fcd34d" },
  { name: "Fuchsia", bg: "#86198f", text: "#fae8ff", accent: "#e879f9" },
];

// ---------------------------------------------------------------------------
// TaskColorPicker — standalone, receives taskType + current index, calls back
// ---------------------------------------------------------------------------
function TaskColorPicker({ taskType, colorIdx, onChange }) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);
  const btnRef = useRef(null);
  const color = PALETTE[colorIdx];

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const pick = (e, idx) => {
    e.stopPropagation();
    onChange(idx);
    setOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@500&display=swap');

        .tcp-row {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
        }
        .tcp-preview {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1.5px solid var(--tcp-border);
          background: var(--tcp-bg);
          flex: 1;
          min-width: 0;
        }
        .tcp-swatch-lg {
          width: 22px;
          height: 22px;
          border-radius: 5px;
          background: var(--tcp-bg);
          border: 2px solid var(--tcp-accent);
          flex-shrink: 0;
        }
        .tcp-label {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: var(--tcp-text);
          font-weight: 500;
        }
        .tcp-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid var(--tcp-border);
          background: var(--tcp-bg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: border-color 0.15s, transform 0.15s;
          padding: 0;
          outline: none;
        }
        .tcp-btn:hover {
          border-color: var(--tcp-accent);
          transform: scale(1.1);
        }
        .tcp-btn-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--tcp-accent);
        }
        .tcp-picker {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 10px;
          padding: 8px;
          display: grid;
          grid-template-columns: repeat(4, 20px);
          gap: 6px;
          z-index: 99999;
          box-shadow: 0 8px 28px rgba(0,0,0,0.6);
          animation: tcp-pop 0.13s ease-out;
        }
        @keyframes tcp-pop {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        .tcp-swatch {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: transform 0.12s, border-color 0.12s;
        }
        .tcp-swatch:hover { transform: scale(1.2); }
        .tcp-swatch.active { border-color: white; }
      `}</style>

      <div
        className="tcp-row"
        style={{
          "--tcp-bg": color.bg,
          "--tcp-text": color.text,
          "--tcp-accent": color.accent,
          "--tcp-border": color.accent + "55",
        }}
      >
        <div className="tcp-preview">
          <div className="tcp-swatch-lg" />
          <span className="tcp-label">{color.name}</span>
        </div>

        <button
          ref={btnRef}
          className="tcp-btn"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          title="Change task color"
        >
          <div className="tcp-btn-dot" />
        </button>

        {open && (
          <div className="tcp-picker" ref={pickerRef}>
            {PALETTE.map((c, i) => (
              <div
                key={c.name}
                className={`tcp-swatch${i === colorIdx ? " active" : ""}`}
                style={{ background: c.bg }}
                title={c.name}
                onClick={(e) => pick(e, i)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const EditIoTProperties = ({
  selectedIOT,
  setSelectedIOT,
  onSave,
  animatedIOTs,
  setAnimatedIOTs,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedIOT, setEditedIOT] = useState({});

  const taskType =
    selectedIOT?.properties?.task_type ?? selectedIOT?.name ?? "";

  const savedColorName = selectedIOT?.properties?.taskColor ?? "Slate";
  const savedColorIdx = PALETTE.findIndex((p) => p.name === savedColorName);
  const [colorIdx, setColorIdx] = useState(
    savedColorIdx >= 0 ? savedColorIdx : 0,
  );

  useEffect(() => {
    const name = selectedIOT?.properties?.taskColor ?? "Slate";
    const idx = PALETTE.findIndex((p) => p.name === name);
    setColorIdx(idx >= 0 ? idx : 0);
  }, [selectedIOT?.id]);

  // When the user picks a color, write to colorMemory and fire event so
  // all Task instances for this task_type re-render immediately.
  const handleColorChange = async (idx) => {
    setColorIdx(idx);
    const colorName = PALETTE[idx].name;

    colorMemory[taskType] = idx;
    window.dispatchEvent(new Event("taskColorChanged"));

    // Persist into the IoT properties
    const updated = {
      ...selectedIOT,
      properties: { ...selectedIOT.properties, taskColor: colorName },
    };
    setSelectedIOT(updated);
    setAnimatedIOTs((prev) =>
      prev.map((iot) => (iot.id === updated.id ? { ...iot, ...updated } : iot)),
    );
    await onSave(updated);
  };

  useEffect(() => {
    setEditedIOT({
      id: selectedIOT.id,
      name: selectedIOT.name || "",
      properties: {
        task_type: selectedIOT.properties.task_type || "",
        dataInput: selectedIOT.properties.dataInput || "image",
        meanSize: selectedIOT.properties.meanSize || 0,
        urgency: selectedIOT.properties.urgency || "BestEffort",
        slack: selectedIOT.properties.slack || 0,
        numTasks: selectedIOT.properties.numTasks || 0,
        startTime: selectedIOT.properties.startTime || 0,
        endTime: selectedIOT.properties.endTime || 0,
        distribution: selectedIOT.properties.distribution || "uniform",
        deviceRole: selectedIOT.properties.deviceRole || "sensor",
        frequency: selectedIOT.properties.frequency || 0,
        connectivity: selectedIOT.properties.connectivity || "WiFi",
        energySource: selectedIOT.properties.energySource || "Wired",
        taskColor: selectedIOT.properties.taskColor || "Slate",
      },
      queue: selectedIOT.queue || [],
    });
  }, [selectedIOT]);

  const handlePresetSelect = async (preset) => {
    if (editMode) {
      setEditedIOT((prev) => ({
        ...prev,
        name: preset.name,
        icon: preset.icon,
      }));
    } else {
      const updated = { ...selectedIOT, name: preset.name, icon: preset.icon };
      setSelectedIOT(updated);
      setAnimatedIOTs((prev) =>
        prev.map((iot) =>
          iot.id === updated.id ? { ...iot, ...updated } : iot,
        ),
      );
      await onSave(updated);
    }
  };

  const PresetPicker = () => (
    <div className="mb-4">
      <p className="text-xs font-bold text-gray-500 uppercase mb-2">
        Device Preset
      </p>
      <div className="grid grid-cols-4 gap-1">
        {IOT_PRESETS.map((preset) => {
          const active = editMode
            ? editedIOT.icon === preset.icon
            : selectedIOT.icon === preset.icon;
          return (
            <button
              key={preset.name}
              title={preset.name}
              onClick={() => handlePresetSelect(preset)}
              className={`flex flex-col items-center p-1.5 rounded border text-xs transition hover:bg-blue-50 ${
                active ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
            >
              {(() => {
                const Icon = IOT_ICON_MAP[preset.icon];
                return Icon ? <Icon size={22} /> : null;
              })()}
              <span
                className="mt-0.5 text-gray-600 truncate w-full text-center"
                style={{ fontSize: "9px" }}
              >
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const frequencyLabel = (role) =>
    role === "actuator"
      ? "Writing Frequency (Hz)"
      : role === "sensor"
        ? "Reading Frequency (Hz)"
        : "Frequency (Hz)";

  const handleChange = (field, value, is_property = true) => {
    if (!is_property) setEditedIOT((prev) => ({ ...prev, [field]: value }));
    else
      setEditedIOT((prev) => ({
        ...prev,
        properties: { ...prev.properties, [field]: value },
      }));
  };

  const handleSave = async () => {
    try {
      const withColor = {
        ...editedIOT,
        properties: {
          ...editedIOT.properties,
          taskColor: PALETTE[colorIdx].name,
        },
      };
      setSelectedIOT(withColor);
      setAnimatedIOTs((prev) =>
        prev.map((iot) =>
          iot.id === withColor.id ? { ...iot, ...withColor } : iot,
        ),
      );
      await onSave(withColor);
      setEditMode(false);
    } catch (error) {
      console.error("Failed to save IoT properties:", error);
      alert("Failed to save IoT properties");
    }
  };

  const handleCancel = () => {
    setEditedIOT({
      id: selectedIOT.id,
      name: selectedIOT.name || "",
      properties: {
        task_type: selectedIOT.properties.task_type || "",
        dataInput: selectedIOT.properties.dataInput || "image",
        meanSize: selectedIOT.properties.meanSize || 0,
        urgency: selectedIOT.properties.urgency || "BestEffort",
        slack: selectedIOT.properties.slack || 0,
        numTasks: selectedIOT.properties.numTasks || 0,
        startTime: selectedIOT.properties.startTime || 0,
        endTime: selectedIOT.properties.endTime || 0,
        distribution: selectedIOT.properties.distribution || "uniform",
        deviceRole: selectedIOT.properties.deviceRole || "sensor",
        frequency: selectedIOT.properties.frequency || 0,
        connectivity: selectedIOT.properties.connectivity || "WiFi",
        energySource: selectedIOT.properties.energySource || "Wired",
      },
      queue: selectedIOT.queue || [],
    });
    setEditMode(false);
  };

  if (!editMode) {
    return (
      <div className="space-y-4">
        <PresetPicker />

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">
            Task Color
          </p>
          <TaskColorPicker
            taskType={taskType}
            colorIdx={colorIdx}
            onChange={handleColorChange}
          />
        </div>

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            IoT Properties
          </h3>
          <button
            onClick={() => setEditMode(true)}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Edit
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Name
            </label>
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedIOT.name || "-"}
            </div>
          </div>

          <div className="border-t pt-3 mt-2">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">
              Device Profile
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Device Role
              </label>
              <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100 capitalize">
                {selectedIOT.properties.deviceRole || "-"}
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {frequencyLabel(selectedIOT.properties.deviceRole || "sensor")}
              </label>
              <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
                {selectedIOT.properties.frequency ?? "-"}
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Connectivity
              </label>
              <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
                {selectedIOT.properties.connectivity || "-"}
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Energy Source
              </label>
              <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
                {selectedIOT.properties.energySource || "-"}
              </div>
            </div>
          </div>

          <div className="border-t pt-3 mt-2">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">
              Task Descriptor
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Task Type
              </label>
              <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
                {selectedIOT.properties.task_type || "-"}
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Data Input
              </label>
              <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
                {selectedIOT.properties.dataInput || "-"}
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Mean Size (KB)
              </label>
              <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
                {selectedIOT.properties.meanSize ?? "-"}
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Urgency
              </label>
              <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
                {selectedIOT.properties.urgency || "-"}
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Slack
              </label>
              <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
                {selectedIOT.properties.slack ?? "-"}
              </div>
            </div>
          </div>

          <div className="border-t pt-3 mt-2">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">
              Arrival / Scenario
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Num Tasks
              </label>
              <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
                {selectedIOT.properties.numTasks ?? "-"}
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Start Time
              </label>
              <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
                {selectedIOT.properties.startTime ?? "-"}
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                End Time
              </label>
              <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
                {selectedIOT.properties.endTime ?? "-"}
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Distribution
              </label>
              <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
                {selectedIOT.properties.distribution || "-"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── EDIT VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Edit IoT Properties
      </h3>

      <PresetPicker />

      <div>
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">
          Task Color
        </p>
        <TaskColorPicker
          taskType={taskType}
          colorIdx={colorIdx}
          onChange={handleColorChange}
        />
      </div>

      <div className="border-t pt-3 mt-2">
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">
          Device Profile
        </p>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Device Role
          </label>
          <select
            value={editedIOT.properties?.deviceRole}
            onChange={(e) => handleChange("deviceRole", e.target.value)}
            className="w-full border px-3 py-2 text-sm rounded"
          >
            <option value="sensor">Sensor</option>
            <option value="actuator">Actuator</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div className="mt-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {frequencyLabel(editedIOT.properties?.deviceRole)}
          </label>
          <input
            type="number"
            min="0"
            value={editedIOT.properties?.frequency}
            onChange={(e) => handleChange("frequency", Number(e.target.value))}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>
        <div className="mt-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Connectivity
          </label>
          <select
            value={editedIOT.properties?.connectivity}
            onChange={(e) => handleChange("connectivity", e.target.value)}
            className="w-full border px-3 py-2 text-sm rounded"
          >
            <option value="WiFi">WiFi</option>
            <option value="Bluetooth">Bluetooth</option>
            <option value="Ethernet">Ethernet</option>
            <option value="5G">5G</option>
            <option value="LTE">LTE</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="mt-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Energy Source
          </label>
          <select
            value={editedIOT.properties?.energySource}
            onChange={(e) => handleChange("energySource", e.target.value)}
            className="w-full border px-3 py-2 text-sm rounded"
          >
            <option value="Wired">Wired</option>
            <option value="Battery">Battery</option>
            <option value="Solar">Solar</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          value={editedIOT.name}
          onChange={(e) => handleChange("name", e.target.value, false)}
          className="w-full border px-3 py-2 text-sm rounded"
        />
      </div>

      <div className="border-t pt-3 mt-2">
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">
          Task Descriptor
        </p>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Task Type
          </label>
          <input
            type="text"
            value={editedIOT.properties?.task_type}
            onChange={(e) => handleChange("task_type", e.target.value)}
            className="w-full border px-3 py-2 text-sm rounded"
            placeholder="e.g. T1"
          />
        </div>
        <div className="mt-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Data Input
          </label>
          <select
            value={editedIOT.properties?.dataInput}
            onChange={(e) => handleChange("dataInput", e.target.value)}
            className="w-full border px-3 py-2 text-sm rounded"
          >
            <option value="image">image</option>
            <option value="audio">audio</option>
            <option value="text">text</option>
            <option value="video">video</option>
          </select>
        </div>
        <div className="mt-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Mean Size (KB)
          </label>
          <input
            type="number"
            min="0"
            value={editedIOT.properties?.meanSize}
            onChange={(e) => handleChange("meanSize", Number(e.target.value))}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>
        <div className="mt-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Urgency
          </label>
          <input
            type="text"
            value={editedIOT.properties?.urgency}
            onChange={(e) => handleChange("urgency", e.target.value)}
            className="w-full border px-3 py-2 text-sm rounded"
            placeholder="e.g. BestEffort"
          />
        </div>
        <div className="mt-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Slack
          </label>
          <input
            type="number"
            min="0"
            value={editedIOT.properties?.slack}
            onChange={(e) => handleChange("slack", Number(e.target.value))}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>
      </div>

      <div className="border-t pt-3 mt-2">
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">
          Arrival / Scenario
        </p>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Num Tasks
          </label>
          <input
            type="number"
            min="0"
            value={editedIOT.properties?.numTasks}
            onChange={(e) => handleChange("numTasks", Number(e.target.value))}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>
        <div className="mt-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Start Time
          </label>
          <input
            type="number"
            min="0"
            value={editedIOT.properties?.startTime}
            onChange={(e) => handleChange("startTime", Number(e.target.value))}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>
        <div className="mt-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            End Time
          </label>
          <input
            type="number"
            min="0"
            value={editedIOT.properties?.endTime}
            onChange={(e) => handleChange("endTime", Number(e.target.value))}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>
        <div className="mt-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Distribution
          </label>
          <select
            value={editedIOT.properties?.distribution}
            onChange={(e) => handleChange("distribution", e.target.value)}
            className="w-full border px-3 py-2 text-sm rounded"
          >
            <option value="uniform">uniform</option>
            <option value="normal">normal</option>
            <option value="exponential">exponential</option>
            <option value="spiky">spiky</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditIoTProperties;
