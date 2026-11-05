import React, { useEffect, useMemo, useRef } from "react";
import { useGlobalState } from "../context/GlobalStates";
import {
  calculateSuggestedSlack,
  shouldApplySlackSuggestion,
} from "../utils/slackSuggestion";
import { getSourceLoadBalancerId } from "../utils/loadBalancers";

const AutoSuggestSlack = ({ source, onSuggest, locked = false }) => {
  const {
    machines,
    iot,
    edges,
    nodes,
    policyAlias,
    simulationSeed,
    schedulingMode,
    batchIntervalSeconds,
  } = useGlobalState();
  const lastAppliedSuggestion = useRef(null);
  const previouslyLocked = useRef(locked);
  const routedLoadBalancer = useMemo(() => {
    const loadBalancerId = getSourceLoadBalancerId(
      `nd_${source?.id}`,
      edges,
      nodes,
    );
    return nodes.find(
      (node) =>
        node.type === "LBNode" && String(node.id) === String(loadBalancerId),
    );
  }, [edges, nodes, source?.id]);
  const effectivePolicyAlias =
    routedLoadBalancer?.data?.policyAlias ?? policyAlias;
  const effectiveSchedulingMode =
    routedLoadBalancer?.data?.schedulingMode ?? schedulingMode;
  const effectiveBatchIntervalSeconds =
    routedLoadBalancer?.data?.batchIntervalSeconds ?? batchIntervalSeconds;
  const suggestion = useMemo(
    () =>
      calculateSuggestedSlack({
        source,
        sources: iot,
        machines,
        edges,
        nodes,
        policyAlias: effectivePolicyAlias,
        simulationSeed,
        schedulingMode: effectiveSchedulingMode,
        batchIntervalSeconds: effectiveBatchIntervalSeconds,
      }),
    [
      source,
      iot,
      machines,
      edges,
      nodes,
      effectivePolicyAlias,
      simulationSeed,
      effectiveSchedulingMode,
      effectiveBatchIntervalSeconds,
    ],
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
