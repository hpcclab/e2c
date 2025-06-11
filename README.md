# E2C-Revamp

This repository contains a small Flask backend and React frontend for experimenting with workload scheduling algorithms.

## Configuration JSON

The backend exposes `/api/workload/upload/config` which accepts a JSON file describing the available machines. Each machine object requires a `type` string and may include `speed` and `id` fields.

Example file:

```json
{
  "machines": [
    { "id": "M1", "type": "basic", "speed": 1 },
    { "id": "M2", "type": "advanced", "speed": 2 }
  ]
}
```

Upload this file using `multipart/form-data` with the key `file`. A successful request responds with `{"message": "Configuration loaded"}`.

For convenience the `server/scripts/test_upload_config.py` script demonstrates how to
send such a request using the [requests](https://pypi.org/project/requests/) library.
