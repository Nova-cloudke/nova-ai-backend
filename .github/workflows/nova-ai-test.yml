name: Test Nova AI

on:
push:
workflow_dispatch:

jobs:
test:
runs-on: ubuntu-latest

steps:
  - name: Checkout repository
    uses: actions/checkout@v4

  - name: Set up Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '20'

  - name: Start Nova AI backend
    run: |
      node index.js > server.log 2>&1 &
      echo $! > server.pid

  - name: Wait for backend
    run: |
      for i in {1..15}; do
        if curl -fsS http://127.0.0.1:3000/api/health; then
          echo "Nova AI is ready."
          exit 0
        fi
        sleep 2
      done
      cat server.log
      exit 1

  - name: Test Nova AI core
    run: |
      curl --fail-with-body -sS \
        -X POST http://127.0.0.1:3000/api/core \
        -H "Content-Type: application/json" \
        -d '{"question":"How can we discover business opportunities?","mode":"all"}'

  - name: Stop Nova AI
    if: always()
    run: |
      if [ -f server.pid ]; then
        kill "$(cat server.pid)" 2>/dev/null || true
      fi
