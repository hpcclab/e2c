import React, { useState } from "react";
import { createPortal } from "react-dom";

const DeadlinePolicyHelp = () => {
  const [open, setOpen] = useState(false);

  return (
    <span className="ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label="Deadline behavior information"
        aria-expanded={open}
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
              aria-labelledby="deadline-behavior-title"
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 text-left shadow-2xl"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2
                  id="deadline-behavior-title"
                  className="text-lg font-bold text-gray-900"
                >
                  What happens when a task misses its deadline?
                </h2>
                <button
                  type="button"
                  aria-label="Close deadline behavior information"
                  onClick={() => setOpen(false)}
                  className="text-xl leading-none text-gray-500 hover:text-gray-800"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 text-sm font-normal leading-6 text-gray-700">
                <p>
                  A task's <strong>deadline</strong> is the latest time it is
                  supposed to finish. E2C calculates it as the task's generation
                  time plus its allowed slack.
                </p>

                <section>
                  <h3 className="font-bold text-gray-900">
                    Drop task at deadline
                  </h3>
                  <p>
                    E2C stops the task as soon as its deadline is reached, even
                    if a machine is already processing it. A task that started
                    but did not finish in time is reported as <strong>MISSED</strong>.
                    A task that never started is reported as <strong>DNR</strong>,
                    which means “Did Not Run.”
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-gray-900">Finish all tasks</h3>
                  <p>
                    E2C does not stop or discard tasks at their deadlines. Every
                    task—including one still waiting in a queue—is allowed to
                    start and run until it finishes. A task that finishes after
                    its deadline is still reported as <strong>MISSED</strong>{" "}
                    because it was late, but its work is completed.
                  </p>
                </section>

                <p className="rounded-md bg-blue-50 p-3 text-blue-900">
                  Choose <strong>Drop task at deadline</strong> when late work
                  should be stopped. Choose <strong>Finish all tasks</strong>{" "}
                  when completing every task matters more than finishing on time.
                </p>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
};

export default DeadlinePolicyHelp;
