import server.utils.time as time
import server.utils.log as log
import server.utils.batch_queue as batch_queue

settings = {
    'verbosity': True,  # or False depending on your debug needs
}

machines = []
no_of_machines = 0


def reset():
    global no_of_machines
    machines.clear()
    time.reset()
    log.clear()
    batch_queue.clear()
    for machine in machines:
        machine.reset()  # assuming .reset() exists