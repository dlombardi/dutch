#!/bin/bash

# Evn Development Bootstrap Script
# This script sets up the development environment and starts all dev servers

set -e

echo "=========================================="
echo "  Evn - Development Environment Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node version
NODE_VERSION=$(node -v 2>/dev/null || echo "not found")
echo -e "${BLUE}Node version:${NC} $NODE_VERSION"

if [[ "$NODE_VERSION" == "not found" ]]; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js 20.x or higher.${NC}"
    exit 1
fi

# Check npm version
NPM_VERSION=$(npm -v 2>/dev/null || echo "not found")
echo -e "${BLUE}npm version:${NC} $NPM_VERSION"
echo ""

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Killing existing process on port $port (PID: $pid)...${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Function to clean up ports before starting
cleanup_ports() {
    echo -e "${YELLOW}Checking for existing processes on required ports...${NC}"
    kill_port 3000  # Web PWA
    kill_port 3001  # API
    kill_port 8081  # Expo Metro bundler
    echo -e "${GREEN}Ports cleared.${NC}"
    echo ""
}

# Function to install dependencies
install_deps() {
    echo -e "${YELLOW}Installing dependencies...${NC}"
    cd "$(dirname "$0")"

    # Install root dependencies
    echo -e "${BLUE}Installing root dependencies...${NC}"
    npm install

    # Install mobile app dependencies
    echo -e "${BLUE}Installing mobile app dependencies...${NC}"
    cd apps/mobile && npm install && cd ../..

    # Install API dependencies
    echo -e "${BLUE}Installing API dependencies...${NC}"
    cd apps/api && npm install && cd ../..

    # Install web app dependencies
    echo -e "${BLUE}Installing web app dependencies...${NC}"
    cd apps/web && npm install && cd ../..

    echo -e "${GREEN}All dependencies installed!${NC}"
    echo ""
}

# Function to start all dev servers
start_servers() {
    echo -e "${YELLOW}Starting development servers...${NC}"
    echo ""

    # Clean up any existing processes on required ports
    cleanup_ports

    # Start services in background and save PIDs
    cd "$(dirname "$0")"

    echo -e "${BLUE}Starting NestJS API on port 3001...${NC}"
    cd apps/api && npm run start:dev &
    API_PID=$!
    cd ../..

    echo -e "${BLUE}Starting Web PWA on port 3000...${NC}"
    cd apps/web && npm run dev &
    WEB_PID=$!
    cd ../..

    echo -e "${BLUE}Starting Expo mobile app...${NC}"
    cd apps/mobile && npm run start &
    MOBILE_PID=$!
    cd ../..

    echo ""
    echo -e "${GREEN}=========================================="
    echo -e "  All servers started!"
    echo -e "==========================================${NC}"
    echo ""
    echo -e "  ${BLUE}Mobile (Expo):${NC}  Scan QR code in terminal"
    echo -e "                 Or press 'i' for iOS simulator"
    echo -e "                 Or press 'a' for Android emulator"
    echo ""
    echo -e "  ${BLUE}Web PWA:${NC}        http://localhost:3000"
    echo ""
    echo -e "  ${BLUE}API:${NC}            http://localhost:3001"
    echo ""
    echo -e "Press Ctrl+C to stop all servers"

    # Wait for any process to exit
    wait
}

# Function to stop all dev servers
stop_servers() {
    echo -e "${YELLOW}Stopping all development servers...${NC}"
    cleanup_ports
    echo -e "${GREEN}All servers stopped.${NC}"
}

# Function to show help
show_help() {
    echo "Usage: ./init.sh [command]"
    echo ""
    echo "Commands:"
    echo "  install    Install all dependencies"
    echo "  start      Start all development servers"
    echo "  stop       Stop all development servers"
    echo "  help       Show this help message"
    echo ""
    echo "If no command is provided, both install and start will run."
}

# Parse command line arguments
case "${1:-}" in
    install)
        install_deps
        ;;
    start)
        start_servers
        ;;
    stop)
        stop_servers
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        install_deps
        start_servers
        ;;
esac
