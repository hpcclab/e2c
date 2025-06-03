queue = []

def clear():
    queue.clear()

def put(task):
    queue.append(task)

def get(index=0):
    return queue.pop(index)

def empty():
    return len(queue) == 0

def list():
    return queue

def load(tasks):
    queue.extend(tasks)