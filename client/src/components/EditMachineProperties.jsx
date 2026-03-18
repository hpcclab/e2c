import React, { useState, useEffect } from "react";
import { useGlobalState } from "../context/GlobalStates";

const EditMachineProperties = ({
  selectedMachine,
  setSelectedMachine,
  onSave,
  setAnimatedMachines,
}) => {
  const { iot } = useGlobalState();
  const [editMode, setEditMode] = useState(false);
  const [editedMachine, setEditedMachine] = useState({});

  useEffect(() => {
    setEditedMachine({
      id: selectedMachine.id,
      name: selectedMachine.name || "",
      power: selectedMachine.power || 0,
      idle_power: selectedMachine.idle_power || 0,
      replicas: selectedMachine.replicas || 1,
      price: selectedMachine.price || 0,
      cost: selectedMachine.cost || 0,
      utilization_time: selectedMachine.utilization_time || 0,
      total_cost: selectedMachine.total_cost || 0,
      total_tasks: selectedMachine.total_tasks || 0,
      eet: selectedMachine.eet || {},
    });
  }, [selectedMachine]);

  const handleEETChange = (iotName, value) => {
    setEditedMachine((prev) => ({
      ...prev,
      eet: { ...prev.eet, [iotName]: value },
    }));
  };

  const handleSave = async () => {
    try {
      // Update local state
      setSelectedMachine(editedMachine);

      // Update animated machines
      setAnimatedMachines((prev) =>
        prev.map((machine) =>
          machine.id === editedMachine.id
            ? { ...machine, ...editedMachine }
            : machine,
        ),
      );

      // Call the save handler from parent
      await onSave(editedMachine);

      setEditMode(false);
    } catch (error) {
      console.error("Failed to save machine properties:", error);
      alert("Failed to save machine properties");
    }
  };

  const handleCancel = () => {
    setEditedMachine({
      id: selectedMachine.id || -1,
      name: selectedMachine.name || "",
      power: selectedMachine.power || 0,
      idle_power: selectedMachine.idle_power || 0,
      replicas: selectedMachine.replicas || 1,
      price: selectedMachine.price || 0,
      cost: selectedMachine.cost || 0,
      utilization_time: selectedMachine.utilization_time || 0,
      total_cost: selectedMachine.total_cost || 0,
      total_tasks: selectedMachine.total_tasks || 0,
      eet: selectedMachine.eet || {},
    });
    setEditMode(false);
  };

  const handleChange = (field, value) => {
    setEditedMachine((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (editMode) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Edit Machine Properties
        </h3>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={editedMachine.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Power
          </label>
          <input
            type="number"
            value={editedMachine.power}
            onChange={(e) => handleChange("power", Number(e.target.value))}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Idle Power
          </label>
          <input
            type="number"
            value={editedMachine.idle_power}
            onChange={(e) => handleChange("idle_power", Number(e.target.value))}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Replicas
          </label>
          <input
            type="number"
            min="1"
            value={editedMachine.replicas}
            onChange={(e) => handleChange("replicas", Number(e.target.value))}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            ($) Price / hr
          </label>
          <input
            type="number"
            step="0.01"
            value={editedMachine.price}
            onChange={(e) => handleChange("price", Number(e.target.value))}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            ($) Cost
          </label>
          <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100 text-gray-600">
            {editedMachine.cost !== undefined ? editedMachine.cost : "-"}
          </div>
        </div>

        {iot.length > 0 && (
          <div className="border-t pt-2 mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estimated Execution Times
            </label>
            <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1 bg-gray-100 text-left">
                    Task Type
                  </th>
                  <th className="border px-2 py-1 bg-gray-100">EET(s)</th>
                </tr>
              </thead>
              <tbody>
                {iot.map((iotNode) => (
                  <tr key={iotNode.id}>
                    <td className="border px-2 py-1 text-gray-600">
                      {iotNode.properties.task_type}
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={
                          editedMachine.eet?.[iotNode.properties.task_type] ||
                          ""
                        }
                        onChange={(e) =>
                          handleEETChange(
                            iotNode.properties.task_type,
                            e.target.value,
                          )
                        }
                        className="w-full border rounded px-1 py-0.5 text-center"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
        <h3 className="text-lg font-semibold text-gray-800">
          Machine Properties
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
            {selectedMachine.name || "-"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Power
          </label>
          <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
            {selectedMachine.power !== undefined ? selectedMachine.power : "-"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Idle Power
          </label>
          <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
            {selectedMachine.idle_power !== undefined
              ? selectedMachine.idle_power
              : "-"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Replicas
          </label>
          <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
            {selectedMachine.replicas !== undefined
              ? selectedMachine.replicas
              : "-"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            ($) Price / hr
          </label>
          <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
            $
            {selectedMachine.price !== undefined
              ? Number(selectedMachine.price).toFixed(2)
              : "0.00"}
          </div>
        </div>

        {/* EET per Task Type */}
        {iot.length > 0 && (
          <div className="border-t pt-2 mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              EET (s) per Task Type
            </label>
            <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1 bg-gray-100 text-left">
                    Task Type
                  </th>
                  <th className="border px-2 py-1 bg-gray-100">EET (s)</th>
                </tr>
              </thead>
              <tbody>
                {iot.map((iotNode) => (
                  <tr key={iotNode.id}>
                    <td className="border px-2 py-1 text-gray-600">
                      {iotNode.properties.task_type}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {selectedMachine.eet?.[iotNode.properties.task_type] !==
                        undefined &&
                      selectedMachine.eet?.[iotNode.properties.task_type] !== ""
                        ? selectedMachine.eet[iotNode.properties.task_type]
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Utilization and Cost Information */}
        <div className="border-t pt-2 mt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Simulation Results
          </label>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium text-gray-600">
                Tasks Completed:
              </span>
              <div className="bg-blue-50 font-bold px-2 py-1 rounded">
                {selectedMachine.total_tasks || 0}
              </div>
            </div>

            <div>
              <span className="font-medium text-gray-600">
                Utilization Hours:
              </span>
              <div className="bg-green-50 font-bold px-2 py-1 rounded">
                {selectedMachine.utilization_time
                  ? Number(selectedMachine.utilization_time).toFixed(3)
                  : "0.000"}
                h
              </div>
            </div>

            <div>
              <span className="font-medium text-gray-600">Total Cost:</span>
              <div className="bg-yellow-50 font-bold px-2 py-1 rounded">
                $
                {selectedMachine.total_cost
                  ? Number(selectedMachine.total_cost).toFixed(2)
                  : "0.00"}
              </div>
            </div>

            <div>
              <span className="font-medium text-gray-600">Cost/Task:</span>
              <div className="bg-purple-50 font-bold px-2 py-1 rounded">
                $
                {selectedMachine.total_tasks && selectedMachine.total_cost
                  ? (
                      Number(selectedMachine.total_cost) /
                      Number(selectedMachine.total_tasks)
                    ).toFixed(2)
                  : "0.00"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMachineProperties;
