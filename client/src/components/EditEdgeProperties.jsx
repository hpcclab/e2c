import React, { useEffect, useState } from "react";
import { useGlobalState } from "../context/GlobalStates";
import {
  EDGE_NETWORK_TYPES,
  formatDataRate,
  getEdgeNetworkVisual,
  resolveEdgeNetwork,
} from "../utils/edgeNetwork";
import { getDefaultDataRateKbps } from "../utils/networkDelay";

const EditEdgeProperties = ({ selectedEdge }) => {
  const { iot, setEdges, setSelectedEdge } = useGlobalState();
  const sourceId = String(selectedEdge?.source ?? "").replace(/^nd_/, "");
  const sourceProperties = iot.find(
    (source) => String(source.id) === sourceId,
  )?.properties;
  const initialNetwork = resolveEdgeNetwork(selectedEdge, sourceProperties);
  const [networkType, setNetworkType] = useState(initialNetwork.networkType);
  const [dataRateKbps, setDataRateKbps] = useState(
    initialNetwork.dataRateKbps,
  );

  const edgeId = selectedEdge?.id ?? null;

  useEffect(() => {
    const nextNetwork = resolveEdgeNetwork(selectedEdge, sourceProperties);
    setNetworkType(nextNetwork.networkType);
    setDataRateKbps(nextNetwork.dataRateKbps);
  }, [edgeId, selectedEdge, sourceProperties]);

  if (!selectedEdge) {
    return <p className="text-sm text-gray-500">No connection selected.</p>;
  }

  const visual = getEdgeNetworkVisual(networkType);

  const handleTypeChange = (nextType) => {
    setNetworkType(nextType);
    setDataRateKbps(getDefaultDataRateKbps(nextType));
  };

  const handleSave = () => {
    const properties = {
      ...selectedEdge.data?.properties,
      networkType,
      dataRateKbps: Math.max(0.001, Number(dataRateKbps) || 0.001),
    };
    const updatedEdge = {
      ...selectedEdge,
      data: { ...selectedEdge.data, properties },
    };

    setEdges((currentEdges) =>
      currentEdges.map((edge) =>
        edge.id === selectedEdge.id ? updatedEdge : edge,
      ),
    );
    setSelectedEdge(updatedEdge);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
          Network connection
        </p>
        <h3 className="text-lg font-semibold text-gray-800 mt-1">
          Edge Properties
        </h3>
        <p className="text-xs text-gray-500 mt-1 leading-5">
          These settings control how long task data takes to travel from its
          source. Slower links and larger tasks create longer travel times.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-2 border">
        <div className="flex justify-between gap-3">
          <span className="font-semibold text-gray-700">From</span>
          <span className="font-mono truncate">{selectedEdge.source}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="font-semibold text-gray-700">To</span>
          <span className="font-mono truncate">{selectedEdge.target}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Network type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {EDGE_NETWORK_TYPES.map((type) => {
            const typeVisual = getEdgeNetworkVisual(type);
            const active = networkType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`rounded-lg border px-3 py-2 text-left transition ${
                  active
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-400"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="block w-8"
                    style={{
                      borderTop: `3px ${typeVisual.dash ? "dashed" : "solid"} ${typeVisual.color}`,
                    }}
                  />
                  <span className="text-xs font-semibold text-gray-800">
                    {type}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="edge-data-rate"
          className="block text-sm font-semibold text-gray-700 mb-1"
        >
          Link speed (Kbps)
        </label>
        <input
          id="edge-data-rate"
          type="number"
          min="0.001"
          step="any"
          value={dataRateKbps}
          onChange={(event) => setDataRateKbps(event.target.value)}
          className="w-full border px-3 py-2 text-sm rounded-lg"
        />
        <p className="text-xs text-gray-500 mt-1">
          Current speed: {formatDataRate(dataRateKbps)}. You can change the
          preset speed to model a weak or unusually fast connection.
        </p>
      </div>

      <div
        className="rounded-lg border p-3"
        style={{ backgroundColor: `${visual.color}12` }}
      >
        <p className="text-xs font-semibold text-gray-700 mb-2">Preview</p>
        <svg width="100%" height="18" aria-hidden="true">
          <line
            x1="4"
            y1="9"
            x2="96%"
            y2="9"
            stroke={visual.color}
            strokeWidth="4"
            strokeDasharray={visual.dash}
            strokeLinecap="round"
          />
        </svg>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
      >
        Apply to connection
      </button>
    </div>
  );
};

export default EditEdgeProperties;
