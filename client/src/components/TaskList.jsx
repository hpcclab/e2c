import Task from "./Task";

export default function TaskList({ machine, onClicked, setSelectedTask, isBatchQueue = false, registerSlotRef }) {
  const taskSlots = Array.from({ length: 6 });
  const emptyTask = {
    id: -1,
    task_type: "empty",
    data_size: "",
    arrival_time: "",
    deadline: "",
  };
  function handleChildClick(event) {
    event.stopPropagation();
    onClicked();
  }
  return (
    <div className="flex gap-2">
      {taskSlots.map((_, i) => {
        const task = i < machine.queue.length ? machine.queue[i] : emptyTask;
        return (
          <div
            key={i}
            ref={(el) => {
              if (registerSlotRef) registerSlotRef(i, el);
            }}
            className="relative min-w-[40px] h-10 px-2 bg-gray-300 rounded border border-gray-700 items-center justify-center text-s"
            onClick={handleChildClick}
            title={task.assigned_machine?.type?.name || "No Machine Assigned"}
          >
            {machine.queue.length > 0 ? (
              <Task
                task={task}
                setSelectedTask={setSelectedTask}
                isBatchQueue={isBatchQueue}
              />
            ) : (
              ""
            )}
          </div>
        );
      })}
    </div>
  );
}
