import React, { useEffect, useMemo, useRef } from "react";
import { useGlobalState } from "../context/GlobalStates";
import {
  calculateSuggestedSlack,
  shouldApplySlackSuggestion,
} from "../utils/slackSuggestion";

const AutoSuggestSlack = ({ source, onSuggest, locked = false }) => {
  const { machines, iot, edges, nodes, policyAlias, simulationSeed } =
    useGlobalState();
  const lastAppliedSuggestion = useRef(null);
  const previouslyLocked = useRef(locked);
  const suggestion = useMemo(
    () =>
      calculateSuggestedSlack({
        source,
        sources: iot,
        machines,
        edges,
        nodes,
        policyAlias,
        simulationSeed,
      }),
    [source, iot, machines, edges, nodes, policyAlias, simulationSeed],
  );

  useEffect(() => {
    lastAppliedSuggestion.current = null;
  }, [source?.id]);

  useEffect(() => {
    const justUnlocked = previouslyLocked.current && !locked;
    previouslyLocked.current = locked;

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
        lastStoredSuggestion: source?.properties?.lastSuggestedSlack,
        suggestedSlack,
        force: justUnlocked,
      })
    ) {
      return;
    }

    lastAppliedSuggestion.current = suggestedSlack;
    onSuggest(suggestedSlack);
  }, [locked, onSuggest, source?.properties?.lastSuggestedSlack, suggestion?.slack]);

  return null;
};

export default AutoSuggestSlack;
