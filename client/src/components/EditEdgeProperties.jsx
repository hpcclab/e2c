import React, { useState, useEffect } from "react";
import { useGlobalState } from "../context/GlobalStates";

const CONNECTION_TYPES = ["LAN", "WAN", "WiFi", "Cellular"];

const EditEdgeProperties = ({ selectedEdge }) => {
  const { setEdges } = useGlobalState();
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState("LAN");

  const edgeId = selectedEdge?.id ?? null;
  const props = selectedEdge?.data?.properties ?? {};

  useEffect(() => {
    setDraft(props.connectionType ?? "LAN");
    setEditMode(false);
  }, [edgeId]);

  if (!selectedEdge) {
    return <p className="text-sm text-gray-500">No edge selected.</p>;
  }

  const handleSave = () => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === selectedEdge.id
          ? {
              ...edge,
              data: {
                ...edge.data,
                properties: { ...edge.data.properties, connectionType: draft },
              },
            }
          : edge,
      ),
    );
    setEditMode(false);
  };

  const handleCancel = () => {
    setDraft(props.connectionType ?? "LAN");
    setEditMode(false);
  };

  return (
    <div className="space-y-4">
      {/* Edge info */}
      <div className="bg-gray-50 rounded p-3 text-xs text-gray-600 space-y-1 border">
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Edge ID</span>
          <span className="font-mono">{selectedEdge.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">From</span>
          <span className="font-mono truncate max-w-[140px]">{selectedEdge.source}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">To</span>
          <span className="font-mono truncate max-w-[140px]">{selectedEdge.target}</span>
        </div>
      </div>

      {/* Connection Type */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-bold text-gray-500 uppercase">Connection Type</p>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              Edit
            </button>
          )}
        </div>

        {editMode ? (
          <>
            <div className="grid grid-cols-4 gap-1 mb-3">
              {CONNECTION_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setDraft(type)}
                  className={`px-2 py-1.5 rounded border text-xs transition hover:bg-blue-50 ${
                    draft === type
                      ? "border-blue-500 bg-blue-50 font-semibold"
                      : "border-gray-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
            {draft}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditEdgeProperties;
