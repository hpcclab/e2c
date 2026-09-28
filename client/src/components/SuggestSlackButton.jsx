import React from "react";
import { useGlobalState } from "../context/GlobalStates";
import { calculateSuggestedSlack } from "../utils/slackSuggestion";

const SuggestSlackButton = ({ source, onSuggest }) => {
  const { machines, edges, nodes } = useGlobalState();
  const suggestion = calculateSuggestedSlack({ source, machines, edges, nodes });

  const suggestSlack = () => {
    if (suggestion) onSuggest(suggestion.slack);
  };

  return (
    <button
      type="button"
      onClick={suggestSlack}
      disabled={!suggestion}
      className="mb-2 w-full rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      Suggest slack
    </button>
  );
};

export default SuggestSlackButton;
