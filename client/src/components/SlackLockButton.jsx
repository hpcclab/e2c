import { FiLock, FiUnlock } from "react-icons/fi";

export default function SlackLockButton({ locked, onToggle }) {
  const label = locked
    ? "Unlock Slack to resume automatic updates"
    : "Lock Slack at its current value";

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={locked}
      title={label}
      onClick={onToggle}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${
        locked
          ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
          : "border-gray-300 bg-white text-gray-500 hover:border-blue-400 hover:text-blue-600"
      }`}
    >
      {locked ? <FiLock aria-hidden="true" /> : <FiUnlock aria-hidden="true" />}
    </button>
  );
}
