import React, { useState, useEffect } from 'react';

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
    setEditedIOT({
      id: selectedIOT.id,
      name: selectedIOT.name || "",
      taskType: selectedIOT.taskType || "",
      dataInput: selectedIOT.dataInput || "image",
      meanSize: selectedIOT.meanSize || 0,
      urgency: selectedIOT.urgency || "BestEffort",
      slack: selectedIOT.slack || 0,
      numTasks: selectedIOT.numTasks || 0,
      startTime: selectedIOT.startTime || 0,
      endTime: selectedIOT.endTime || 0,
      distribution: selectedIOT.distribution || "uniform",
      properties: selectedIOT.properties || [],
      queue: selectedIOT.queue || [],
    });
  }, [selectedIOT]);

  const handleChange = (field, value) => {
    setEditedIOT(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSelectedIOT(editedIOT);
      setAnimatedIOTs(prev =>
        prev.map(iot => iot.id === editedIOT.id ? { ...iot, ...editedIOT } : iot)
      );
      await onSave(editedIOT);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to save IoT properties:', error);
      alert('Failed to save IoT properties');
    }
  };

  const handleCancel = () => {
    setEditedIOT({
      id: selectedIOT.id,
      name: selectedIOT.name || "",
      taskType: selectedIOT.taskType || "",
      dataInput: selectedIOT.dataInput || "image",
      meanSize: selectedIOT.meanSize || 0,
      urgency: selectedIOT.urgency || "BestEffort",
      slack: selectedIOT.slack || 0,
      numTasks: selectedIOT.numTasks || 0,
      startTime: selectedIOT.startTime || 0,
      endTime: selectedIOT.endTime || 0,
      distribution: selectedIOT.distribution || "uniform",
    });
    setEditMode(false);
  };

  if (editMode) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit IoT Properties</h3>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={editedIOT.name}
            onChange={e => handleChange('name', e.target.value)}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>

        <div className="border-t pt-3 mt-2">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Task Descriptor</p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Task Type</label>
            <input
              type="text"
              value={editedIOT.taskType}
              onChange={e => handleChange('taskType', e.target.value)}
              className="w-full border px-3 py-2 text-sm rounded"
              placeholder="e.g. T1"
            />
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Data Input</label>
            <select
              value={editedIOT.dataInput}
              onChange={e => handleChange('dataInput', e.target.value)}
              className="w-full border px-3 py-2 text-sm rounded"
            >
              <option value="image">image</option>
              <option value="audio">audio</option>
              <option value="text">text</option>
              <option value="video">video</option>
            </select>
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mean Size (KB)</label>
            <input
              type="number"
              min="0"
              value={editedIOT.meanSize}
              onChange={e => handleChange('meanSize', Number(e.target.value))}
              className="w-full border px-3 py-2 text-sm rounded"
            />
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Urgency</label>
            <input
              type="text"
              value={editedIOT.urgency}
              onChange={e => handleChange('urgency', e.target.value)}
              className="w-full border px-3 py-2 text-sm rounded"
              placeholder="e.g. BestEffort"
            />
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Slack</label>
            <input
              type="number"
              min="0"
              value={editedIOT.slack}
              onChange={e => handleChange('slack', Number(e.target.value))}
              className="w-full border px-3 py-2 text-sm rounded"
            />
          </div>
        </div>

        <div className="border-t pt-3 mt-2">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Arrival / Scenario</p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Num Tasks</label>
            <input
              type="number"
              min="0"
              value={editedIOT.numTasks}
              onChange={e => handleChange('numTasks', Number(e.target.value))}
              className="w-full border px-3 py-2 text-sm rounded"
            />
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
            <input
              type="number"
              min="0"
              value={editedIOT.startTime}
              onChange={e => handleChange('startTime', Number(e.target.value))}
              className="w-full border px-3 py-2 text-sm rounded"
            />
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
            <input
              type="number"
              min="0"
              value={editedIOT.endTime}
              onChange={e => handleChange('endTime', Number(e.target.value))}
              className="w-full border px-3 py-2 text-sm rounded"
            />
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Distribution</label>
            <select
              value={editedIOT.distribution}
              onChange={e => handleChange('distribution', e.target.value)}
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
          <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
          <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
            {selectedIOT.name || "-"}
          </div>
        </div>

        <div className="border-t pt-3 mt-2">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Task Descriptor</p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Task Type</label>
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedIOT.taskType || "-"}
            </div>
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Data Input</label>
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedIOT.dataInput || "-"}
            </div>
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mean Size (KB)</label>
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedIOT.meanSize !== undefined ? selectedIOT.meanSize : "-"}
            </div>
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Urgency</label>
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedIOT.urgency || "-"}
            </div>
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Slack</label>
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedIOT.slack !== undefined ? selectedIOT.slack : "-"}
            </div>
          </div>
        </div>

        <div className="border-t pt-3 mt-2">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Arrival / Scenario</p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Num Tasks</label>
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedIOT.numTasks !== undefined ? selectedIOT.numTasks : "-"}
            </div>
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedIOT.startTime !== undefined ? selectedIOT.startTime : "-"}
            </div>
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedIOT.endTime !== undefined ? selectedIOT.endTime : "-"}
            </div>
          </div>

          <div className="mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Distribution</label>
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedIOT.distribution || "-"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditIoTProperties;
