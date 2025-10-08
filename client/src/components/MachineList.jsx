import TaskList from "./TaskList";

export default function MachineList({machs, onClicked, onTaskClicked, setSelectedMachine, setSelectedTask, registerMachineSlotRef}) {
  return(
    machs.map(machine => (
      <div
        key={machine.id}
        className="bg-white border-4 p-4 rounded-lg shadow-md flex items-center space-x-4"
      >
        <div className="flex space-x-2">
          <TaskList
            machine={machine}
            onClicked={onTaskClicked}
            setSelectedTask={setSelectedTask}
            registerSlotRef={(slotIdx, el) => {
              if (registerMachineSlotRef) registerMachineSlotRef(machine.id, slotIdx, el);
            }}
          />
        </div>
        <div
          onClick={()=>{
            setSelectedMachine({ 
              name: machine.name,
              power: machine.power,
              idle_power: machine.idle_power,
              replicas: machine.replicas,})
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
