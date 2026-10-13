import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdSettings } from "react-icons/md";
import { normalizeRandomSeed } from "../utils/randomSeed";
import {
  MAX_SIMULATION_RUNS,
  normalizeSimulationRunCount,
  normalizeSimulationSeeds,
} from "../utils/simulationBatch";

const SimulationSeedSettings = ({
  value,
  runCount = 1,
  seeds = [],
  onApply,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [draftCount, setDraftCount] = useState(
    normalizeSimulationRunCount(runCount),
  );
  const [draftSeeds, setDraftSeeds] = useState(
    normalizeSimulationSeeds(runCount, seeds, value),
  );
  const savedSeed = normalizeRandomSeed(value);
  const savedRunCount = normalizeSimulationRunCount(runCount);

  useEffect(() => {
    if (!open) return;
    setDraftCount(savedRunCount);
    setDraftSeeds(
      normalizeSimulationSeeds(savedRunCount, seeds, savedSeed),
    );
  }, [open, savedRunCount, savedSeed, seeds]);

  const updateRunCount = (nextValue) => {
    if (nextValue === "") {
      setDraftCount("");
      return;
    }
    const nextCount = normalizeSimulationRunCount(nextValue);
    setDraftCount(nextCount);
    setDraftSeeds((current) =>
      normalizeSimulationSeeds(nextCount, current, savedSeed),
    );
  };

  const finishRunCountEdit = () => {
    const normalizedCount = normalizeSimulationRunCount(draftCount);
    setDraftCount(normalizedCount);
    setDraftSeeds((current) =>
      normalizeSimulationSeeds(normalizedCount, current, savedSeed),
    );
  };

  const updateSeed = (index, nextValue) => {
    setDraftSeeds((current) =>
      current.map((seed, seedIndex) =>
        seedIndex === index ? nextValue : seed,
      ),
    );
  };

  const apply = () => {
    const normalizedCount = normalizeSimulationRunCount(draftCount);
    const normalizedSeeds = normalizeSimulationSeeds(
      normalizedCount,
      draftSeeds,
      savedSeed,
    );
    onApply({ runCount: normalizedCount, seeds: normalizedSeeds });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Simulation random seed settings"
        title={
          savedRunCount > 1
            ? `${savedRunCount} simulations configured`
            : savedSeed
              ? `Simulation seed: ${savedSeed}`
              : "Simulation seed settings"
        }
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md transition ${
          disabled
            ? "cursor-not-allowed bg-gray-300"
            : "bg-slate-600 hover:bg-slate-700"
        }`}
      >
        <MdSettings className="h-6 w-6" aria-hidden="true" />
        {(savedSeed || savedRunCount > 1) && (
          <span
            className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-blue-500 px-1 text-[10px] font-bold text-white"
            aria-label={`${savedRunCount} simulations configured`}
          >
            {savedRunCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="simulation-seed-title"
              className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 text-left shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="simulation-seed-title" className="text-xl font-bold text-gray-900">
                    Simulation Settings
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Run one visible simulation while additional runs complete in the background.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close simulation seed settings"
                  onClick={() => setOpen(false)}
                  className="text-2xl leading-none text-gray-500 hover:text-gray-800"
                >
                  ×
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm leading-6 text-gray-700">
                <p>
                  Every run uses the same topology and settings, but it can use its own seed. Each run's seed controls:
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>task generation times for every IoT distribution;</li>
                  <li>task data sizes sampled from their normal distributions;</li>
                  <li>actual execution times sampled from EET distributions; and</li>
                  <li>random scheduling choices made by randomized policies.</li>
                </ul>
                <p className="rounded-md bg-blue-50 p-3 text-blue-900">
                  Reports shows the visible run separately and an exact per-run table plus averages across every completed run.
                </p>
              </div>

              <label htmlFor="simulation-run-count" className="mt-4 block text-sm font-semibold text-gray-800">
                Number of simulations
              </label>
              <input
                id="simulation-run-count"
                type="number"
                min="1"
                max={MAX_SIMULATION_RUNS}
                value={draftCount}
                onChange={(event) => updateRunCount(event.target.value)}
                onBlur={finishRunCountEdit}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum {MAX_SIMULATION_RUNS} runs. Run 1 is the only run shown on the canvas; all others use background workers.
              </p>

              <div className="mt-5">
                <h3 className="text-sm font-bold text-gray-900">
                  Simulation seed list
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the seed that should be used for each individual simulation. A blank seed uses fresh randomness.
                </p>
                <ol className="mt-3 divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200">
                  {draftSeeds.map((seed, index) => (
                    <li
                      key={`simulation-seed-${index}`}
                      className="grid gap-2 bg-white p-3 sm:grid-cols-[150px_1fr] sm:items-center"
                    >
                      <label
                        htmlFor={`simulation-seed-input-${index}`}
                        className="text-sm font-semibold text-gray-800"
                      >
                        Simulation {index + 1}
                        {index === 0 && (
                          <span className="mt-0.5 block text-xs font-normal text-blue-700">
                            Visible on canvas
                          </span>
                        )}
                      </label>
                      <input
                        id={`simulation-seed-input-${index}`}
                        type="text"
                        value={seed}
                        onChange={(event) =>
                          updateSeed(index, event.target.value)
                        }
                        placeholder="Enter seed or leave blank"
                        className="w-full rounded border px-3 py-2 text-sm"
                        aria-label={`Simulation ${index + 1} seed${index === 0 ? " (visible run)" : ""}`}
                      />
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={apply}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Apply settings
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default SimulationSeedSettings;
