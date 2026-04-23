export const SCHEDULER_REGISTRY = {};
export function registerScheduler(alias, SchedulerClass) {
  SCHEDULER_REGISTRY[alias] = SchedulerClass;
}
