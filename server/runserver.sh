#!/bin/bash

cd "$(dirname "$0")"  # Go to /Users/jakegonzales/E2C-Revamp/server
source ./venv/bin/activate  # or ./bin/activate if that's your venv

cd ..  # Go up to project root: /Users/jakegonzales/E2C-Revamp

# Now run as a module from the root
python -m server.app