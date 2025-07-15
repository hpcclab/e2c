export default function Task({task, setSelectedTask}) {
  const details =  {
    "id": task.id, 
    "task_type" : task.task_type, 
    "data_size" : task.data_size, 
    "arrival_time" : task.arrival_time,
    "deadline" : task.deadline,
  }
  return(
    <>
        <div className="flex space-x-2" onClick={()=>{
            setSelectedTask(details)
        }}>
        {details.id >=0 ? details.id : ""}
        </div>
    </>
                
  );
}
 