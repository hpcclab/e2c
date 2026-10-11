import React, { useEffect, useRef } from "react";
import { useGlobalState } from "../context/GlobalStates";
import {
  calculateSuggestedSlack,
  shouldApplySlackSuggestion,
} from "../utils/slackSuggestion";

const AutoSuggestSlack = ({ source, onSuggest, locked = false }) => {
  const { machines, edges, nodes } = useGlobalState();
  const lastAppliedSuggestion = useRef(null);
  const suggestion = calculateSuggestedSlack({ source, machines, edges, nodes });

  useEffect(() => {
    lastAppliedSuggestion.current = null;
  }, [source?.id]);

  useEffect(() => {
    if (locked) {
      // Clear the cache so unlocking immediately restores the latest suggestion,
      // even when the calculated value itself did not change while locked.
      lastAppliedSuggestion.current = null;
      return;
    }

    const suggestedSlack = suggestion?.slack ?? 1;
    if (
      !shouldApplySlackSuggestion({
        locked,
        lastAppliedSuggestion: lastAppliedSuggestion.current,
        suggestedSlack,
      })
    ) {
      return;
    }

    lastAppliedSuggestion.current = suggestedSlack;
    onSuggest(suggestedSlack);
  }, [locked, onSuggest, suggestion?.slack]);

  return null;
};

export default AutoSuggestSlack;
