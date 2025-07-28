export default function Task({ task, setSelectedTask }) {
  const details = {
    id: task.id,
    task_type: task.task_type,
    data_size: task.data_size,
    arrival_time: task.arrival_time,
    deadline: task.deadline,
  };

  return (
    <div
      className="flex items-center justify-center w-full h-full text-s text-center 
                 bg-gray-300 rounded transition duration-200 cursor-pointer 
                 hover:bg-blue-500 hover:text-white hover:scale-105"
      onClick={() => setSelectedTask(details)}
      title={`Task ID: ${details.id}`}
    >
      {details.task_type}
    </div>
  );
}
