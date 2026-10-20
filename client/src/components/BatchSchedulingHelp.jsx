import React, { useState } from "react";
import { createPortal } from "react-dom";

const BatchSchedulingHelp = () => {
  const [open, setOpen] = useState(false);

  return (
    <span className="ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label="Scheduling mode information"
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
              aria-labelledby="scheduling-mode-title"
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 text-left shadow-2xl"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2
                  id="scheduling-mode-title"
                  className="text-lg font-bold text-gray-900"
                >
                  Immediate and periodic batch scheduling
                </h2>
                <button
                  type="button"
                  aria-label="Close scheduling mode information"
                  onClick={() => setOpen(false)}
                  className="text-xl leading-none text-gray-500 hover:text-gray-800"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 text-sm font-normal leading-6 text-gray-700">
                <section>
                  <h3 className="font-bold text-gray-900">
                    Immediate (event-based)
                  </h3>
                  <p>
                    The load balancer considers a task as soon as the task
                    finishes traveling from its source and arrives at the load
                    balancer.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-gray-900">
                    Periodic (batch)
                  </h3>
                  <p>
                    Arrived tasks wait at the load balancer until the next batch
                    time. At that instant, the selected policy assigns every
                    waiting task it can to machine queues. Machines continue
                    processing previously assigned work between batch times.
                  </p>
                </section>

                <p className="rounded-md bg-blue-50 p-3 text-blue-900">
                  For a 5-second period, batches occur at 5, 10, 15 seconds and
                  so on. A task arriving at exactly 5 seconds joins that batch;
                  a task arriving just after 5 seconds waits until 10 seconds.
                </p>

                <p>
                  Batch waiting uses part of the task's slack because the
                  deadline is still generation time plus slack. With the drop
                  policy, a task whose deadline expires before dispatch is
                  reported as <strong>DNR</strong>. With Finish all tasks, it
                  remains waiting but is reported as missed if it finishes late.
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

export default BatchSchedulingHelp;
