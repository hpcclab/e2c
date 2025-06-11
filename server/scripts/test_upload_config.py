import json
import requests

URL = "http://localhost:5001/api/workload/upload/config"

def main():
    sample = {
        "machines": [
            {"id": "M1", "type": "basic", "speed": 1}
        ]
    }
    with open("temp_config.json", "w") as f:
        json.dump(sample, f)

    with open("temp_config.json", "rb") as f:
        response = requests.post(URL, files={"file": f})

    print("Status:", response.status_code)
    print("Response:", response.json())

if __name__ == "__main__":
    main()
