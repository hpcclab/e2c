import React, { useState } from "react";
import { TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const MachineTypesTab = ({ machineTypes, setMachineTypes, setActiveTab }) => {
  const [newName, setNewName] = useState("");
  const [newPower, setNewPower] = useState("");
  const [newIdlePower, setNewIdlePower] = useState("");
  const [newReplicas, setNewReplicas] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editRow, setEditRow] = useState({});

  const addMachineType = () => {
    if (!newName.trim()) return;
    setMachineTypes([
      ...machineTypes,
      {
        name: newName,
        power: newPower,
        idlePower: newIdlePower,
        replicas: newReplicas,
      },
    ]);
    setNewName("");
    setNewPower("");
    setNewIdlePower("");
    setNewReplicas("");
  };

  const startEdit = (idx) => {
    setEditIdx(idx);
    setEditRow(machineTypes[idx]);
  };

  const cancelEdit = () => {
    setEditIdx(null);
    setEditRow({});
  };

  const saveEdit = () => {
    setMachineTypes(machineTypes.map((m, idx) => idx === editIdx ? editRow : m));
    setEditIdx(null);
    setEditRow({});
  };

  const handleEditChange = (field, value) => {
    setEditRow({ ...editRow, [field]: value });
  };

  const removeMachineType = idx => {
    setMachineTypes(machineTypes.filter((_, i) => i !== idx));
  };

  // Save only machine types as config (for full config, pass handler from parent)
  const handleSaveConfig = () => {
    const config = {
      machines: machineTypes.map(m => ({
        name: m.name,
        power: Number(m.power),
        idle_power: Number(m.idlePower),
        replicas: Number(m.replicas),
      })),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "config.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Preview Table */}
      <div className="mt-6">
        <table className="min-w-full border border-gray-300 rounded text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Power</th>
              <th className="border px-2 py-1">Idle Power</th>
              <th className="border px-2 py-1"># of Replicas</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {machineTypes.length === 0 ? (
              <tr>
                <td colSpan={5} className="border px-2 py-1 text-center text-gray-400">No machine types</td>
              </tr>
            ) : (
              machineTypes.map((type, idx) => (
                <tr key={idx}>
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
                        <input
                          type="number"
                          value={editRow.power}
                          onChange={e => handleEditChange("power", e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          value={editRow.idlePower}
                          onChange={e => handleEditChange("idlePower", e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          value={editRow.replicas}
                          onChange={e => handleEditChange("replicas", e.target.value)}
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
                      <td className="border px-2 py-1">{type.name || "-"}</td>
                      <td className="border px-2 py-1">{type.power || "-"}</td>
                      <td className="border px-2 py-1">{type.idlePower || "-"}</td>
                      <td className="border px-2 py-1">{type.replicas || "-"}</td>
                      <td className="border px-2 py-1 flex gap-2">
                        <button onClick={() => startEdit(idx)} title="Edit">
                          <PencilIcon className="w-5 h-5 text-blue-600" />
                        </button>
                        <button onClick={() => removeMachineType(idx)} title="Remove">
                          <TrashIcon className="w-5 h-5 text-red-500" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Add Machine Type Section */}
        <div className="bg-gray-50 p-4 rounded shadow flex flex-col gap-3 mt-8">
          <h3 className="font-semibold text-lg text-gray-700 mb-2">Add Machine Type</h3>
          <input
            type="text"
            placeholder="Machine Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="number"
            placeholder="Power"
            value={newPower}
            onChange={e => setNewPower(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="number"
            placeholder="Idle Power"
            value={newIdlePower}
            onChange={e => setNewIdlePower(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="number"
            placeholder="# of Replicas"
            value={newReplicas}
            onChange={e => setNewReplicas(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
            onClick={addMachineType}
          >
            Add Machine Type
          </button>

          <button
            className="bg-gray-700 text-white px-4 py-2 rounded mt-2 self-end"
            onClick={handleSaveConfig}
          >
            Save Config
          </button>

          <button
            className="bg-green-600 text-white px-4 py-2 rounded mt-2 self-end"
            onClick={() => setActiveTab && setActiveTab("scenario")}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default MachineTypesTab;