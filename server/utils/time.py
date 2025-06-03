current_time = 0

def gct():
    return current_time

def reset():
    global current_time
    current_time = 0

def increment():
    global current_time
    current_time += 1
