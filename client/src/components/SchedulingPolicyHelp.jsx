import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  SCHEDULING_MODES,
  normalizeSchedulingMode,
} from "../utils/scheduling";

const POLICY_DETAILS = [
  {
    alias: "FCFS",
    name: "First Come, First Serve",
    chooses:
      "Processes arrived tasks in arrival order. It first uses an idle eligible machine; if every eligible machine is busy, it chooses the machine with the shortest queue.",
    usefulFor: "A simple, predictable policy that respects task arrival order.",
    tradeoff:
      "It does not compare machines' expected execution times, so it may not choose the fastest machine.",
  },
  {
    alias: "MECT",
    name: "Minimum Expected Completion Time",
    chooses:
      "Chooses the eligible machine with the smallest estimated amount of work already waiting in its queue.",
    usefulFor: "Sending a task to the machine expected to clear its current work first.",
    tradeoff:
      "The current implementation compares queued work and does not include the incoming task's own execution time in that comparison.",
  },
  {
    alias: "MEET",
    name: "Minimum Expected Execution Time",
    chooses:
      "Chooses the eligible machine with the lowest configured mean expected execution time for this task type and source.",
    usefulFor: "Favoring the machine expected to run the task itself the fastest.",
    tradeoff:
      "It does not consider how many tasks are already waiting on that machine.",
  },
  {
    alias: "RAND",
    name: "Random",
    chooses:
      "Randomly samples two eligible machines and assigns the task to the sampled machine with the shorter queue.",
    usefulFor: "Low-overhead load distribution when a varied assignment is acceptable.",
    tradeoff:
      "Results can change between simulation runs, and expected execution time is not considered.",
  },
  {
    alias: "URI",
    name: "Uniform Resender Identifier",
    chooses:
      "Uses a repeatable hash of the task type to select a position in the eligible-machine list. Tasks of the same type normally return to the same machine while the eligible list stays unchanged.",
    usefulFor: "Keeping similar task types assigned consistently.",
    tradeoff:
      "A fixed mapping can create uneven queues, and it does not compare queue length or expected execution time.",
  },
  {
    alias: "LC",
    name: "Least Connection",
    chooses:
      "Chooses the eligible machine with the fewest tasks currently waiting in its queue.",
    usefulFor: "Spreading tasks across machines by queue count.",
    tradeoff:
      "All queued tasks count equally, even when their expected execution times are very different.",
  },
  {
    alias: "MM",
    name: "MinCompletion–MinCompletion",
    chooses:
      "For every waiting task, first finds the eligible machine that gives that task its minimum expected completion time. It then assigns the task-machine pair with the smallest completion time in the whole batch and repeats.",
    usefulFor:
      "Reducing expected completion times across a batch of tasks.",
    tradeoff:
      "It does not directly prioritize deadlines, so a less urgent short task can be selected before an urgent task.",
  },
  {
    alias: "MMU",
    name: "MinCompletion–MaxUrgency",
    chooses:
      "For every waiting task, first finds its minimum-completion machine. It then assigns the task with the smallest predicted slack, meaning the task whose deadline is most at risk.",
    usefulFor:
      "Balancing fast machine choices with deadline urgency.",
    tradeoff:
      "Prioritizing urgent tasks can delay tasks that would otherwise complete quickly.",
  },
  {
    alias: "MSD",
    name: "MinCompletion–SoonestDeadline",
    chooses:
      "For every waiting task, first finds its minimum-completion machine. It then assigns the task with the earliest absolute deadline; equal deadlines are broken by expected completion time.",
    usefulFor: "Giving earliest-deadline tasks priority within each batch.",
    tradeoff:
      "Deadline order can increase overall completion time compared with MM.",
  },
];

const IMMEDIATE_ALIASES = new Set(["FCFS", "MECT", "MEET", "RAND", "URI", "LC"]);
const BATCH_ALIASES = new Set(["MM", "MMU", "MSD"]);

const SchedulingPolicyHelp = ({ selectedPolicy, schedulingMode }) => {
  const [open, setOpen] = useState(false);
  const periodic =
    normalizeSchedulingMode(schedulingMode) ===
    SCHEDULING_MODES.PERIODIC_BATCH;
  const visiblePolicies = POLICY_DETAILS.filter((policy) =>
    (periodic ? BATCH_ALIASES : IMMEDIATE_ALIASES).has(policy.alias),
  );

  return (
    <span className="ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label="Scheduling policy information"
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
              aria-labelledby="scheduling-policy-title"
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 text-left shadow-2xl"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="scheduling-policy-title"
                    className="text-lg font-bold text-gray-900"
                  >
                    Scheduling policies
                  </h2>
                  <p className="mt-1 text-sm font-normal leading-5 text-gray-600">
                    {periodic
                      ? "At each batch time, a batch policy considers all waiting tasks together. Only reachable machines with available queue capacity are used."
                      : "An immediate policy chooses a machine whenever a task arrives. Only machines reachable through the configured connections are considered."}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close scheduling policy information"
                  onClick={() => setOpen(false)}
                  className="text-xl leading-none text-gray-500 hover:text-gray-800"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                {visiblePolicies.map((policy) => {
                  const isSelected = policy.alias === selectedPolicy;

                  return (
                    <section
                      key={policy.alias}
                      className={`rounded-lg border p-4 text-sm font-normal leading-5 ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-gray-900">
                          {policy.name} ({policy.alias})
                        </h3>
                        {isSelected && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                            Currently selected
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-gray-700">
                        <strong>How it chooses:</strong> {policy.chooses}
                      </p>
                      <p className="mt-1 text-gray-700">
                        <strong>Useful for:</strong> {policy.usefulFor}
                      </p>
                      <p className="mt-1 text-gray-700">
                        <strong>Main tradeoff:</strong> {policy.tradeoff}
                      </p>
                    </section>
                  );
                })}
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

export default SchedulingPolicyHelp;
