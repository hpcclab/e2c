import React, { useState } from "react";
import { createPortal } from "react-dom";

const SlackHelp = ({ value, onApply }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const openModal = () => {
    setDraft(String(value ?? 0));
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

  const applySlack = () => {
    if (!onApply) return;
    const parsed = Number(draft);
    onApply(Number.isFinite(parsed) ? Math.max(0, parsed) : 0);
    closeModal();
  };

  return (
    <span className="relative ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label="Slack information"
        aria-expanded={open}
        onClick={openModal}
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
              if (event.target === event.currentTarget) closeModal();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="slack-information-title"
              className="w-full max-w-md rounded-lg bg-white p-6 text-left shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2
                  id="slack-information-title"
                  className="text-lg font-bold text-gray-900"
                >
                  Suggested Slack
                </h2>
                <button
                  type="button"
                  aria-label="Close Slack information"
                  onClick={closeModal}
                  className="text-xl leading-none text-gray-500 hover:text-gray-800"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 space-y-3 text-sm font-normal leading-6 text-gray-700">
                <p>
                  Slack is the complete time window allowed for a task, starting
                  at its generation time and ending at its deadline.
                </p>
                <p>
                  <strong>Deadline = generation time + slack.</strong> Generation
                  time is when the IoT or human user creates the task. The task
                  then spends part of its slack traveling to the machine, where
                  travel time depends on its data size and connection data rate.
                  Its arrival time is generation time + travel time.
                </p>
                <p>
                  The automatic suggestion combines a 95% transfer-time
                  estimate with a 95% execution-time estimate for the slowest
                  connected machine. Time waiting in the machine queue is not
                  predictable from these values, so a busy system may require
                  additional slack.
                </p>
                <p>
                  If E2C cannot calculate the suggestion—for example, because
                  no machine is connected—it defaults to <strong>1 second</strong>.
                </p>
              </div>

              <label
                htmlFor="suggested-slack-value"
                className="mb-1 block text-sm font-semibold text-gray-700"
              >
                Suggested Slack (seconds)
              </label>
              <input
                id="suggested-slack-value"
                type="number"
                min="0"
                step="any"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                readOnly={!onApply}
                className={`w-full rounded border px-3 py-2 text-sm ${
                  onApply ? "bg-white" : "bg-gray-100"
                }`}
              />

              {!onApply && (
                <p className="mt-2 text-xs font-normal text-gray-500">
                  Select Edit to change this value.
                </p>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {onApply ? "Cancel" : "Close"}
                </button>
                {onApply && (
                  <button
                    type="button"
                    onClick={applySlack}
                    className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
};

export default SlackHelp;
