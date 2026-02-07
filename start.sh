#!/bin/bash

# Model Drift Monitor - Startup Script
# This script starts both the backend and frontend servers

echo "========================================"
echo "  Model Drift Monitor - Starting Up"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "app" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Start Backend
echo -e "${BLUE}Starting Backend Server...${NC}"
cd backend
python app.py &
BACKEND_PID=$!
cd ..

echo -e "${GREEN}Backend started on http://localhost:8000${NC}"
echo ""

# Wait for backend to initialize
sleep 2

# Start Frontend
echo -e "${BLUE}Starting Frontend Server...${NC}"
cd app
npm run preview &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}Frontend started on http://localhost:4173${NC}"
echo ""

echo "========================================"
echo -e "${GREEN}All services are running!${NC}"
echo ""
echo "Backend API:  http://localhost:8000"
echo "Frontend UI:  http://localhost:4173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "========================================"

# Wait for both processes
wait
