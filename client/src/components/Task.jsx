export default function Task({ task, setSelectedTask }) {
    const details = {
      id: String(task.id),
      task_type: String(task.task_type),
      assigned_machine: String(task.assigned_machine),
      data_size: String(task.data_size),
      arrival_time: String(task.arrival_time),
      deadline: String(task.deadline),
      start: String(task.start),
      end: String(task.end),
      status: String(task.status),
    };
  
    return (
      <div
        className="flex items-center justify-center w-full h-full text-s text-center 
                   bg-gray-300 rounded transition duration-200 cursor-pointer 
                   hover:bg-blue-500 hover:text-white hover:scale-105"
        onClick={() => setSelectedTask(details)}
        title={`Task ID: ${details.id}`}
      >
        {details.id >=0? details.id : ""}
      </div>
    );
  }
  