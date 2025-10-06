import React, { useState } from "react";
import { TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const defaultInputs = [
  "image",
  "audio",
  "text",
  "video",
  "biological",
  "geographical",
  "numeric",
];

const TaskTypesTab = ({ taskTypes, setTaskTypes, setActiveTab }) => {
  const [newName, setNewName] = useState("");
  const [newDataInput, setNewDataInput] = useState(defaultInputs[0]);
  const [newMeanSize, setNewMeanSize] = useState("");
  const [customInputs, setCustomInputs] = useState([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState("");
  const [newUrgency, setNewUrgency] = useState("BestEffort");
  const [newSlack, setNewSlack] = useState("");

  const [editIdx, setEditIdx] = useState(null);
  const [editRow, setEditRow] = useState({});

  const allInputs = [...defaultInputs, ...customInputs];

  const removeType = (idx) => {
    setTaskTypes(taskTypes.filter((_, i) => i !== idx));
  };

  const addType = () => {
    if (!newName.trim()) return;
    setTaskTypes([
      ...taskTypes,
      {
        name: newName,
        dataInput: newDataInput,
        meanSize: newMeanSize,
        urgency: newUrgency,
        slack: newSlack,
      },
    ]);
    setNewName("");
    setNewDataInput(defaultInputs[0]);
    setNewMeanSize("");
    setNewUrgency("BestEffort");
    setNewSlack("");
  };

  const handleAddCustomInput = () => {
    if (customInputValue.trim() && !allInputs.includes(customInputValue.trim())) {
      setCustomInputs([...customInputs, customInputValue.trim()]);
      setNewDataInput(customInputValue.trim());
      setCustomInputValue("");
      setShowCustomInput(false);
    }
  };

  // Edit logic
  const startEdit = (idx) => {
    setEditIdx(idx);
    setEditRow(taskTypes[idx]);
  };

  const cancelEdit = () => {
    setEditIdx(null);
    setEditRow({});
  };

  const saveEdit = () => {
    setTaskTypes(taskTypes.map((t, idx) => idx === editIdx ? editRow : t));
    setEditIdx(null);
    setEditRow({});
  };

  const handleEditChange = (field, value) => {
    setEditRow({ ...editRow, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Preview Table */}
      <div className="mt-6">
        <table className="min-w-full border border-gray-300 rounded text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">ID</th>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Data Input</th>
              <th className="border px-2 py-1">Mean Data Size (KB)</th>
              <th className="border px-2 py-1">Urgency</th>
              <th className="border px-2 py-1">Slack</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {taskTypes.length === 0 ? (
              <tr>
                <td className="border px-2 py-1 text-center text-gray-400" colSpan={7}>-</td>
              </tr>
            ) : (
              taskTypes.map((type, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1">{idx + 1}</td>
                  {editIdx === idx ? (
                    <>
                      <td className="border px-2 py-1">
                        <input
                          type="text"
                          value={editRow.name}
                          onChange={e => handleEditChange("name", e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="border px-2 py-1">
                        <select
                          value={editRow.dataInput}
                          onChange={e => handleEditChange("dataInput", e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                        >
                          {allInputs.map((input, i) => (
                            <option key={i} value={input}>{input}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          value={editRow.meanSize}
                          onChange={e => handleEditChange("meanSize", e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="border px-2 py-1">
                        <select
                          value={editRow.urgency}
                          onChange={e => handleEditChange("urgency", e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                        >
                          <option value="BestEffort">BestEffort</option>
                          {/* Add more urgency options here if needed */}
                        </select>
                      </td>
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          value={editRow.slack}
                          onChange={e => handleEditChange("slack", e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="border px-2 py-1 flex gap-2">
                        <button onClick={saveEdit} title="Save">
                          <CheckIcon className="w-5 h-5 text-green-600" />
                        </button>
                        <button onClick={cancelEdit} title="Cancel">
                          <XMarkIcon className="w-5 h-5 text-gray-500" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border px-2 py-1">{typeof type === "object" ? type.name : type}</td>
                      <td className="border px-2 py-1">{typeof type === "object" ? type.dataInput : "-"}</td>
                      <td className="border px-2 py-1">{typeof type === "object" ? type.meanSize : "-"}</td>
                      <td className="border px-2 py-1">{typeof type === "object" ? type.urgency : "-"}</td>
                      <td className="border px-2 py-1">{typeof type === "object" ? type.slack : "-"}</td>
                      <td className="border px-2 py-1 flex gap-2">
                        <button
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => startEdit(idx)}
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeType(idx)}
                          title="Remove"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Add Task Type Section */}
        <div className="bg-gray-50 p-4 rounded shadow flex flex-col gap-3 mt-8">
          <h3 className="font-semibold text-lg text-gray-700 mb-2">Add Task Type</h3>
          <input
            type="text"
            placeholder="Task Type Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <div className="flex gap-2 items-center">
            <select
              value={newDataInput}
              onChange={e => setNewDataInput(e.target.value)}
              className="border rounded px-3 py-2 flex-1"
            >
              {allInputs.map((input, idx) => (
                <option key={idx} value={input}>{input}</option>
              ))}
            </select>
            <button
              className="bg-blue-500 text-white px-3 py-2 rounded"
              onClick={() => setShowCustomInput(true)}
              type="button"
            >
              + New Data Input
            </button>
          </div>
          {showCustomInput && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Custom Data Input"
                value={customInputValue}
                onChange={e => setCustomInputValue(e.target.value)}
                className="border rounded px-3 py-2 flex-1"
              />
              <button
                className="bg-green-500 text-white px-3 py-2 rounded"
                onClick={handleAddCustomInput}
                type="button"
              >
                Add
              </button>
              <button
                className="bg-gray-300 text-gray-700 px-3 py-2 rounded"
                onClick={() => { setShowCustomInput(false); setCustomInputValue(""); }}
                type="button"
              >
                Cancel
              </button>
            </div>
          )}
          <input
            type="number"
            placeholder="Mean Data Size (KB)"
            value={newMeanSize}
            onChange={e => setNewMeanSize(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <select
            value={newUrgency}
            onChange={e => setNewUrgency(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="BestEffort">BestEffort</option>
            {/* Add more urgency options here if needed */}
          </select>
          <input
            type="number"
            placeholder="Slack"
            value={newSlack}
            onChange={e => setNewSlack(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
            onClick={addType}
          >
            Add Task Type
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded mt-2 self-end"
            onClick={() => setActiveTab("machineTypes")}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskTypesTab;