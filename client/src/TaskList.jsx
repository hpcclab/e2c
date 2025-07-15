import Task from "./Task";

export default function TaskList({machine, onClicked, setSelectedTask}) {
   const taskSlots = Array.from({ length: 6 });
   const emptyTask = {"id": -1, "task_type": "empty", "data_size" : "", "arrival_time" : "", "deadline" : "",}

  return(
    <>
        <div className="flex flex-row-reverse space-x-2 space-x-reverse">
                    {taskSlots.map((_, i) => (
                        <div
                        key={i}
                        className="w-10 h-10 bg-gray-300 rounded border border-gray-700"
                        onClick={onClicked}
                        >{machine.queue.length > 0 ? <Task task={ i < machine.queue.length ? machine.queue[i] : emptyTask} setSelectedTask={setSelectedTask}/> :""}</div>
                    ))}
                    </div>
    </>
                
  );
}
 