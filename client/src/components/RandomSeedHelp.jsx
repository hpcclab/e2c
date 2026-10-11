import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { normalizeRandomSeed } from "../utils/randomSeed";

const HELP_CONTENT = {
  dataSize: {
    title: "Data-size random seed",
    description:
      "E2C draws each task's data size from a normal distribution using the configured mean size and standard deviation.",
    effect:
      "Using the same seed, mean size, standard deviation, and number of tasks produces the same sequence of task sizes.",
  },
  arrival: {
    title: "Generation-time random seed",
    description:
      "E2C uses the selected distribution to generate task times between the generation start and end times. A task's machine arrival time is its generation time plus its network travel time.",
    effect:
      "Using the same seed, distribution, time window, and number of tasks produces the same sequence of generation times.",
  },
};

const RandomSeedHelp = ({ kind, value, onApply }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(normalizeRandomSeed(value));
  const content = HELP_CONTENT[kind] ?? HELP_CONTENT.arrival;
  const savedSeed = normalizeRandomSeed(value);

  useEffect(() => {
    if (open) setDraft(normalizeRandomSeed(value));
  }, [open, value]);

  const apply = () => {
    onApply?.(normalizeRandomSeed(draft));
    setOpen(false);
  };

  return (
    <span className="ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label={`${content.title} information`}
        aria-expanded={open}
        title={savedSeed ? `Seed set to: ${savedSeed}` : "Set a random seed"}
        onClick={() => setOpen(true)}
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full border border-blue-600 text-[11px] font-bold leading-none ${
          savedSeed
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
        }`}
      >
        <span aria-hidden="true">i</span>
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
              aria-labelledby={`random-seed-title-${kind}`}
              className="w-full max-w-lg rounded-lg bg-white p-6 text-left shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <h2
                  id={`random-seed-title-${kind}`}
                  className="text-lg font-bold text-gray-900"
                >
                  {content.title}
                </h2>
                <button
                  type="button"
                  aria-label={`Close ${content.title.toLowerCase()}`}
                  onClick={() => setOpen(false)}
                  className="text-xl leading-none text-gray-500 hover:text-gray-800"
                >
                  ×
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm font-normal leading-6 text-gray-700">
                <p>{content.description}</p>
                <p>{content.effect}</p>
                <p className="rounded-md bg-blue-50 p-3 text-blue-900">
                  Enter any number or text as the seed. Leave it blank to use
                  fresh random values each time a workload is generated.
                </p>
              </div>

              <label
                htmlFor={`random-seed-input-${kind}`}
                className="mt-4 block text-sm font-semibold text-gray-800"
              >
                Seed
              </label>
              <input
                id={`random-seed-input-${kind}`}
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Blank = fresh randomness"
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />

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
                  Apply seed
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
};

export default RandomSeedHelp;
