import { Machine } from "./Machine";

export default function MachineList({
  machs,
  onClicked,
  onTaskClicked,
  setSelectedMachine,
  setSelectedTask,
}) {
  return machs.map((machine) => (
    <Machine
      key={machine.id}
      machine={machine}
      onTaskClicked={onTaskClicked}
      setSelectedTask={setSelectedTask}
      setSelectedMachine={setSelectedMachine}
      onClicked={onClicked}
    />
  ));
}
