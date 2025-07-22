import { useEffect } from "react";
import TaskList from "./TaskList";

export default function MachineList({machs, onClicked, onTaskClicked, setSelectedMachine, setSelectedTask}) {
   const testMachines = [{
    "id": 0, 
    "task_type" : "t0", 
    "data_size" : 0, 
    "arrival_time" : 1.0,
    "deadline" : 0,
  },{
    "id": 1, 
    "task_type" : "t1", 
    "data_size" : 1, 
    "arrival_time" : 1.1,
    "deadline" : 1,
  }]
  useEffect(()=>{machs.map((machine) => (machine.queue.push(...testMachines)))},[])
    
   
   
  return(
    machs.map(machine => (
              <div
                key={machine.id}
                className="bg-white border-4 p-4 rounded-lg shadow-md flex items-center space-x-4"
              >
                <div className="flex space-x-2">
                  <TaskList machine={machine} onClicked={onTaskClicked} setSelectedTask={setSelectedTask}/>
                </div>
                <div
                  onClick={()=>{
                    setSelectedMachine({"id" : machine.id, "name" : machine.name, "queue": machine.queue})
                    onClicked()
                }}
                  className="text-white bg-blue-600 font-semibold w-16 h-10 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition"
                >
                  {machine.name}
                </div>
              </div>
            ))
  );
}
