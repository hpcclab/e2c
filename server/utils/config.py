import server.utils.time as time
import server.utils.log as log
import server.utils.batch_queue as batch_queue

settings = {
    'verbosity': True,  # or False depending on your debug needs
}


global scheduling_method
global local_scheduling_method
global event_queue
global Time
global machines, machine_types, machine_type_names, no_of_machines
global task_types, task_type_names
global machine_queue_size, batch_queue_size
global bandwidth, network_latency

machines = []
no_of_machines = 0


def reset():
    """Reset global simulator state."""
    no_of_machines = 0
    machines.clear()
    time.reset()
    log.clear()
    batch_queue.clear()
    for machine in machines:
        if hasattr(machine, 'reset'):
            machine.reset()

