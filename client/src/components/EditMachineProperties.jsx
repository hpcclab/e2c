import React, { useState, useEffect } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const EditableMachineProperties = ({ 
  selectedMachine, 
  setSelectedMachine, 
  onSave,
  animatedMachines,
  setAnimatedMachines 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    if (selectedMachine) {
      setEditValues({
        name: selectedMachine.name || '',
        power: selectedMachine.power || '',
        idle_power: selectedMachine.idle_power || '',
        replicas: selectedMachine.replicas || '',
        price: selectedMachine.price || '',
        cost: selectedMachine.cost || ''
      });
    }
  }, [selectedMachine]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValues({
      name: selectedMachine.name || '',
      power: selectedMachine.power || '',
      idle_power: selectedMachine.idle_power || '',
      replicas: selectedMachine.replicas || '',
      price: selectedMachine.price || '',
      cost: selectedMachine.cost || ''
    });
  };

  const handleSave = () => {
    // Update selectedMachine
    const updatedMachine = {
      ...selectedMachine,
      name: editValues.name,
      power: Number(editValues.power),
      idle_power: Number(editValues.idle_power),
      replicas: Number(editValues.replicas),
      price: Number(editValues.price),
      cost: Number(editValues.cost)
    };

    setSelectedMachine(updatedMachine);

    // Update animatedMachines array
    setAnimatedMachines(prev => 
      prev.map(machine => 
        machine.id === selectedMachine.id 
          ? updatedMachine 
          : machine
      )
    );

    // Call onSave callback to update config file
    if (onSave) {
      onSave(updatedMachine);
    }

    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!selectedMachine) {
    return <div className="text-gray-500">No machine selected</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Machine Properties</h3>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
            title="Edit Properties"
          >
            <PencilIcon className="w-4 h-4" />
            <span className="text-sm">Edit</span>
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center space-x-1 text-green-600 hover:text-green-800"
              title="Save Changes"
            >
              <CheckIcon className="w-4 h-4" />
              <span className="text-sm">Save</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
              title="Cancel"
            >
              <XMarkIcon className="w-4 h-4" />
              <span className="text-sm">Cancel</span>
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
          {isEditing ? (
            <input
              type="text"
              value={editValues.name}
              onChange={e => handleInputChange('name', e.target.value)}
              className="w-full border px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedMachine.name || "N/A"}
            </div>
          )}
        </div>

        {/* Power */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Power </label>
          {isEditing ? (
            <input
              type="number"
              value={editValues.power}
              onChange={e => handleInputChange('power', e.target.value)}
              className="w-full border px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedMachine.power !== undefined ? selectedMachine.power : "N/A"}
            </div>
          )}
        </div>

        {/* Idle Power */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Idle Power </label>
          {isEditing ? (
            <input
              type="number"
              value={editValues.idle_power}
              onChange={e => handleInputChange('idle_power', e.target.value)}
              className="w-full border px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedMachine.idle_power !== undefined ? selectedMachine.idle_power : "N/A"}
            </div>
          )}
        </div>

        {/* Replicas */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Replicas</label>
          {isEditing ? (
            <input
              type="number"
              value={editValues.replicas}
              onChange={e => handleInputChange('replicas', e.target.value)}
              className="w-full border px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedMachine.replicas !== undefined ? selectedMachine.replicas : "N/A"}
            </div>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              value={editValues.price}
              onChange={e => handleInputChange('price', e.target.value)}
              className="w-full border px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedMachine.price !== undefined ? selectedMachine.price : "N/A"}
            </div>
          )}
        </div>

        {/* Cost */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Cost </label>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              value={editValues.cost}
              onChange={e => handleInputChange('cost', e.target.value)}
              className="w-full border px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
              {selectedMachine.cost !== undefined ? selectedMachine.cost : "N/A"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EditMachineProperties = ({ 
  selectedMachine, 
  setSelectedMachine, 
  onSave,
  animatedMachines,
  setAnimatedMachines
}) => {
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
    });
  }, [selectedMachine]);

  const handleSave = async () => {
    try {
      // Update local state
      setSelectedMachine(editedMachine);
      
      // Update animated machines
      setAnimatedMachines(prev => 
        prev.map(machine => 
          machine.id === editedMachine.id ? { ...machine, ...editedMachine } : machine
        )
      );

      // Call the save handler from parent
      await onSave(editedMachine);
      
      setEditMode(false);
    } catch (error) {
      console.error('Failed to save machine properties:', error);
      alert('Failed to save machine properties');
    }
  };

  const handleCancel = () => {
    setEditedMachine({
      id: selectedMachine.id,
      name: selectedMachine.name || "",
      power: selectedMachine.power || 0,
      idle_power: selectedMachine.idle_power || 0,
      replicas: selectedMachine.replicas || 1,
      price: selectedMachine.price || 0,
      cost: selectedMachine.cost || 0,
    });
    setEditMode(false);
  };

  const handleChange = (field, value) => {
    setEditedMachine(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (editMode) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Machine Properties</h3>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={editedMachine.name}
            onChange={e => handleChange('name', e.target.value)}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Power</label>
          <input
            type="number"
            value={editedMachine.power}
            onChange={e => handleChange('power', Number(e.target.value))}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Idle Power</label>
          <input
            type="number"
            value={editedMachine.idle_power}
            onChange={e => handleChange('idle_power', Number(e.target.value))}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Replicas</label>
          <input
            type="number"
            min="1"
            value={editedMachine.replicas}
            onChange={e => handleChange('replicas', Number(e.target.value))}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
          <input
            type="number"
            step="0.01"
            value={editedMachine.price}
            onChange={e => handleChange('price', Number(e.target.value))}
            className="w-full border px-3 py-2 text-sm rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Cost</label>
          <input
            type="number"
            step="0.01"
            value={editedMachine.cost}
            onChange={e => handleChange('cost', Number(e.target.value))}
            className="w-full border px-3 py-2 text-sm rounded"
          />
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
        <h3 className="text-lg font-semibold text-gray-800">Machine Properties</h3>
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
            {selectedMachine.name || "N/A"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Power</label>
          <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
            {selectedMachine.power !== undefined ? selectedMachine.power : "N/A"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Idle Power</label>
          <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
            {selectedMachine.idle_power !== undefined ? selectedMachine.idle_power : "N/A"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Replicas</label>
          <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
            {selectedMachine.replicas !== undefined ? selectedMachine.replicas : "N/A"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
          <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
            {selectedMachine.price !== undefined ? selectedMachine.price : "N/A"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Cost</label>
          <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
            {selectedMachine.cost !== undefined ? selectedMachine.cost : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMachineProperties;