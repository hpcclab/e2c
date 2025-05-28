import csv

def parse_csv_workload(file_path):
    parsed_data = []
    with open(file_path, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            parsed_data.append(row)
    return parsed_data
