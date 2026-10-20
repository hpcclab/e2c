import React, { useEffect, useMemo, useState } from "react";
import BatchSchedulingHelp from "./BatchSchedulingHelp";
import DeadlinePolicyHelp from "./DeadlinePolicyHelp";
import SchedulingPolicyHelp from "./SchedulingPolicyHelp";
import {
  MAX_BATCH_INTERVAL_SECONDS,
  MIN_BATCH_INTERVAL_SECONDS,
  SCHEDULING_MODES,
  getSchedulingPolicyOptions,
  normalizeBatchIntervalSeconds,
  normalizeSchedulingPolicyAlias,
} from "../utils/scheduling";

const makeDraft = ({
  policyAlias,
  deadlinePolicy,
  schedulingMode,
  batchIntervalSeconds,
}) => ({
  policyAlias,
  deadlinePolicy,
  schedulingMode,
  batchIntervalSeconds,
});

const ReadOnlyValue = ({ children }) => (
  <div className="w-full rounded border bg-gray-100 px-3 py-2 text-sm text-gray-800">
    {children}
  </div>
);

const schedulingModeDescription = (mode) =>
  mode === SCHEDULING_MODES.PERIODIC_BATCH
    ? "Tasks accumulate at the load balancer and are sent to machines together at each batch period."
    : "Each task is sent to a machine as soon as it arrives at the load balancer.";

const EditLoadBalancerProperties = ({
  policyAlias,
  deadlinePolicy,
  schedulingMode,
  batchIntervalSeconds,
  onSave,
}) => {
  const settings = useMemo(
    () => ({
      policyAlias,
      deadlinePolicy,
      schedulingMode,
      batchIntervalSeconds,
    }),
    [
      batchIntervalSeconds,
      deadlinePolicy,
      policyAlias,
      schedulingMode,
    ],
  );
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(() => makeDraft(settings));

  useEffect(() => {
    if (!editMode) setDraft(makeDraft(settings));
  }, [editMode, settings]);

  const selectedPolicyOptions = getSchedulingPolicyOptions(schedulingMode);
  const selectedPolicy =
    selectedPolicyOptions.find((option) => option.alias === policyAlias) ??
    selectedPolicyOptions[0];
  const draftPolicyOptions = getSchedulingPolicyOptions(draft.schedulingMode);

  const handleSave = () => {
    const normalized = {
      ...draft,
      policyAlias: normalizeSchedulingPolicyAlias(
        draft.policyAlias,
        draft.schedulingMode,
      ),
      batchIntervalSeconds: normalizeBatchIntervalSeconds(
        draft.batchIntervalSeconds,
      ),
    };
    onSave(normalized);
    setDraft(normalized);
    setEditMode(false);
  };

  const handleCancel = () => {
    setDraft(makeDraft(settings));
    setEditMode(false);
  };

  if (editMode) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Edit Load Balancer Properties
        </h3>

        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            Scheduling mode
            <BatchSchedulingHelp />
          </label>
          <select
            value={draft.schedulingMode}
            onChange={(event) =>
              setDraft((current) => {
                const nextMode = event.target.value;
                return {
                  ...current,
                  schedulingMode: nextMode,
                  policyAlias: normalizeSchedulingPolicyAlias(
                    current.policyAlias,
                    nextMode,
                  ),
                };
              })
            }
            className="w-full rounded border bg-white px-3 py-2 text-sm"
          >
            <option value={SCHEDULING_MODES.IMMEDIATE}>
              Immediate (event-based)
            </option>
            <option value={SCHEDULING_MODES.PERIODIC_BATCH}>
              Periodic (batch)
            </option>
          </select>
          <p className="text-xs leading-5 text-gray-500">
            {schedulingModeDescription(draft.schedulingMode)}
          </p>
        </div>

        {draft.schedulingMode === SCHEDULING_MODES.PERIODIC_BATCH && (
          <div className="space-y-2">
            <label
              htmlFor="batch-period-seconds"
              className="block text-sm font-medium text-gray-700"
            >
              Batch period (seconds)
            </label>
            <input
              id="batch-period-seconds"
              type="number"
              min={MIN_BATCH_INTERVAL_SECONDS}
              max={MAX_BATCH_INTERVAL_SECONDS}
              step="0.01"
              value={draft.batchIntervalSeconds}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  batchIntervalSeconds: event.target.value,
                }))
              }
              className="w-full rounded border px-3 py-2 text-sm"
            />
            <p className="text-xs leading-5 text-gray-500">
              Arrived tasks wait for batch times at this interval. The first
              batch occurs after one complete period.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            Load Balancing Policy
            <SchedulingPolicyHelp
              selectedPolicy={draft.policyAlias}
              schedulingMode={draft.schedulingMode}
            />
          </label>
          <select
            value={draft.policyAlias}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                policyAlias: event.target.value,
              }))
            }
            className="w-full rounded border bg-white px-3 py-2 text-sm"
          >
            {draftPolicyOptions.map(({ name, alias }) => (
              <option key={name} value={alias}>
                {name} ({alias})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            Upon missing deadline <DeadlinePolicyHelp />
          </label>
          <select
            value={draft.deadlinePolicy}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                deadlinePolicy: event.target.value,
              }))
            }
            className="w-full rounded border bg-white px-3 py-2 text-sm"
          >
            <option value="drop">Drop task at deadline</option>
            <option value="continue">Finish all tasks</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded bg-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Load Balancer Properties
        </h3>
        <button
          type="button"
          onClick={() => setEditMode(true)}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Edit
        </button>
      </div>

      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          Scheduling mode
          <BatchSchedulingHelp />
        </label>
        <ReadOnlyValue>
          {schedulingMode === SCHEDULING_MODES.PERIODIC_BATCH
            ? "Periodic (batch)"
            : "Immediate (event-based)"}
        </ReadOnlyValue>
        <p className="text-xs leading-5 text-gray-500">
          {schedulingModeDescription(schedulingMode)}
        </p>
      </div>

      {schedulingMode === SCHEDULING_MODES.PERIODIC_BATCH && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Batch period (seconds)
          </label>
          <ReadOnlyValue>
            {normalizeBatchIntervalSeconds(batchIntervalSeconds)}
          </ReadOnlyValue>
        </div>
      )}

      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          Load Balancing Policy
          <SchedulingPolicyHelp
            selectedPolicy={policyAlias}
            schedulingMode={schedulingMode}
          />
        </label>
        <ReadOnlyValue>
          {selectedPolicy
            ? `${selectedPolicy.name} (${selectedPolicy.alias})`
            : policyAlias}
        </ReadOnlyValue>
      </div>

      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          Upon missing deadline <DeadlinePolicyHelp />
        </label>
        <ReadOnlyValue>
          {deadlinePolicy === "continue"
            ? "Finish all tasks"
            : "Drop task at deadline"}
        </ReadOnlyValue>
      </div>
    </div>
  );
};

export default EditLoadBalancerProperties;
