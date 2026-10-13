import React, { useState } from "react";
import { createPortal } from "react-dom";

const DISTRIBUTIONS = [
  {
    name: "Uniform",
    description:
      "Each task independently chooses any time between Generation Start Time and Generation End Time with equal probability. Tasks can still happen close together by chance.",
  },
  {
    name: "Normal",
    description:
      "Tasks are most likely near the middle of the generation window and become less likely toward either end. Random values outside the window are moved to the nearest boundary.",
  },
  {
    name: "Exponential",
    description:
      "Tasks begin at the start of the window and use random exponential gaps. Short gaps are more common than long gaps, so arrivals are uneven. Any time that passes the end of the window is placed at the end time.",
  },
  {
    name: "Spiky",
    description:
      "E2C randomly chooses burst centers and places tasks close to those centers. There is about one burst for every 10 tasks, with at least one burst, so activity occurs in clusters instead of being evenly spread.",
  },
];

const DistributionHelp = () => {
  const [open, setOpen] = useState(false);

  return (
    <span className="ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label="Task generation distribution information"
        aria-expanded={open}
        title="Explain generation-time distributions"
        onClick={() => setOpen(true)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-blue-600 bg-blue-50 text-[11px] font-bold leading-none text-blue-700 hover:bg-blue-100"
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
              aria-labelledby="distribution-help-title"
              className="w-full max-w-2xl rounded-xl bg-white p-6 text-left shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="distribution-help-title" className="text-xl font-bold text-gray-900">
                    Task generation-time distributions
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    A distribution controls when an IoT generates its tasks inside the selected time window.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close distribution information"
                  onClick={() => setOpen(false)}
                  className="text-2xl leading-none text-gray-500 hover:text-gray-800"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {DISTRIBUTIONS.map((distribution) => (
                  <section key={distribution.name} className="rounded-lg border border-gray-200 p-3">
                    <h3 className="font-bold text-gray-900">{distribution.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-700">{distribution.description}</p>
                  </section>
                ))}
              </div>

              <p className="mt-4 rounded-md bg-blue-50 p-3 text-sm leading-6 text-blue-900">
                Every choice above is random. Set the simulation seed from the gear beside Play to reproduce the same generation times and every other random value.
              </p>
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
};

export default DistributionHelp;
