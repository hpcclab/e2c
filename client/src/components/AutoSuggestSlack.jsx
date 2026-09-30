import React, { useEffect, useRef } from "react";
import { useGlobalState } from "../context/GlobalStates";
import { calculateSuggestedSlack } from "../utils/slackSuggestion";

const AutoSuggestSlack = ({ source, onSuggest }) => {
  const { machines, edges, nodes } = useGlobalState();
  const lastAppliedSuggestion = useRef(null);
  const suggestion = calculateSuggestedSlack({ source, machines, edges, nodes });

  useEffect(() => {
    lastAppliedSuggestion.current = null;
  }, [source?.id]);

  useEffect(() => {
    const suggestedSlack = suggestion?.slack ?? 1;
    if (lastAppliedSuggestion.current === suggestedSlack) {
      return;
    }

    lastAppliedSuggestion.current = suggestedSlack;
    onSuggest(suggestedSlack);
  }, [onSuggest, suggestion?.slack]);

  return null;
};

export default AutoSuggestSlack;
