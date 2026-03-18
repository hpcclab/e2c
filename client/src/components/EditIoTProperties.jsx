import React, { useState, useEffect } from "react";

const EditIoTProperties = ({
  selectedIOT,
  setSelectedIOT,
  onSave,
  animatedIOTs,
  setAnimatedIOTs,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedIOT, setEditedIOT] = useState({});

  useEffect(() => {
    console.log("iot - selectedMachine updated:", selectedIOT);
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
      },
      properties: selectedIOT.properties || {},
      queue: selectedIOT.queue || [],
    });
  }, [selectedIOT]);

  const handleChange = (field, value, is_property = true) => {
    if (!is_property) setEditedIOT((prev) => ({ ...prev, [field]: value }));
    else
      setEditedIOT((prev) => ({
        ...prev,
        properties: {
          ...prev.properties,
          [field]: value,
        },
      }));
  };

  const handleSave = async () => {
    try {
      setSelectedIOT(editedIOT);
      setAnimatedIOTs((prev) =>
        prev.map((iot) =>
          iot.id === editedIOT.id ? { ...iot, ...editedIOT } : iot,
        ),
      );
      await onSave(editedIOT);
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
      },
      properties: selectedIOT.properties || {},
      queue: selectedIOT.queue || [],
    });
    setEditMode(false);
  };

  if (editMode) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Edit IoT Properties
        </h3>

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
              value={editedIOT.properties.task_type}
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
              value={editedIOT.properties.dataInput}
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
              value={editedIOT.properties.meanSize}
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
              value={editedIOT.properties.urgency}
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
              value={editedIOT.properties.slack}
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
              value={editedIOT.properties.numTasks}
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
              value={editedIOT.properties.startTime}
              onChange={(e) =>
                handleChange("startTime", Number(e.target.value))
              }
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
              value={editedIOT.properties.endTime}
              onChange={(e) => handleChange("endTime", Number(e.target.value))}
              className="w-full border px-3 py-2 text-sm rounded"
            />
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Distribution
            </label>
            <select
              value={editedIOT.properties.distribution}
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
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">IoT Properties</h3>
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
              {selectedIOT.properties.meanSize !== undefined
                ? selectedIOT.properties.meanSize
                : "-"}
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
              {selectedIOT.properties.slack !== undefined
                ? selectedIOT.properties.slack
                : "-"}
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
              {selectedIOT.properties.numTasks !== undefined
                ? selectedIOT.properties.numTasks
                : "-"}
            </div>
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Start Time
            </label>
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedIOT.properties.startTime !== undefined
                ? selectedIOT.properties.startTime
                : "-"}
            </div>
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              End Time
            </label>
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedIOT.properties.endTime !== undefined
                ? selectedIOT.properties.endTime
                : "-"}
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
};

export default EditIoTProperties;
