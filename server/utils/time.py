global current_time

def gct():
    return current_time

def reset():
    global current_time
    current_time = 0

def increment(step=1):
    global current_time
    current_time += step
