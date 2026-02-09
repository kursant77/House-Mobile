#!/bin/bash

# ==============================================================================
# 🏠 HOUSE MOBILE - Integrated Startup System
# ==============================================================================

# Exit on error
set -e

# --- Color Configuration ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# --- UI Helpers ---
print_banner() {
    clear
    echo -e "${CYAN}${BOLD}"
    echo "  ██╗  ██╗ ██████╗ ██╗   ██╗███████╗███████╗    ███╗   ███╗ ██████╗ ██████╗ ██╗██╗     ███████╗"
    echo "  ██║  ██║██╔═══██╗██║   ██║██╔════╝██╔════╝    ████╗ ████║██╔═══██╗██╔══██╗██║██║     ██╔════╝"
    echo "  ███████║██║   ██║██║   ██║███████╗█████╗      ██╔████╔██║██║   ██║██████╔╝██║██║     █████╗  "
    echo "  ██╔══██║██║   ██║██║   ██║╚════██║██╔══╝      ██║╚██╔╝██║██║   ██║██╔══██╗██║██║     ██╔══╝  "
    echo "  ██║  ██║╚██████╔╝╚██████╔╝███████║███████╗    ██║ ╚═╝ ██║╚██████╔╝██████╔╝██║███████╗███████╗"
    echo "  ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝╚══════╝    ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚═╝╚══════╝╚══════╝"
    echo -e "${NC}"
    echo -e "  ${BOLD}Local Development Suite${NC} | v1.0.0"
    echo -e "  ------------------------------------------------------------------------------------------"
    echo ""
}

print_status() {
    echo -e "${BLUE}[${CYAN}PROCESS${BLUE}]${NC} $1..."
}

print_success() {
    echo -e "${GREEN}[${BOLD}SUCCESS${GREEN}]${NC} $1"
}

print_error() {
    echo -e "${RED}[${BOLD}ERROR${RED}]${NC} $1"
}

# --- Cleanup on Exit ---
cleanup() {
    echo ""
    echo -e "${YELLOW}� Shutting down server and bot processes...${NC}"
    # Kill all jobs in our process group
    kill $(jobs -p) 2>/dev/null || true
    echo -e "${GREEN}✨ Clean exit successful.${NC}"
    exit
}

trap cleanup SIGINT SIGTERM EXIT

# ==============================================================================
# EXECUTION START
# ==============================================================================

print_banner

# 1. Setup & Build Frontend
print_status "Setting up Frontend (Vite + React)"
cd "frontend"
if [ ! -d "node_modules" ]; then
    echo -e "  ${YELLOW}📦 Installing frontend dependencies (one-time setup)...${NC}"
    npm install
fi
echo -e "  ${BLUE}🔨 Building optimized production assets...${NC}"
npm run build
cd ..
print_success "Frontend is ready."

# 2. Setup Telegram Bot
print_status "Setting up Telegram Bot (Grammy)"
cd "telegram-bot"
if [ ! -d "node_modules" ]; then
    echo -e "  ${YELLOW}📦 Installing bot dependencies (one-time setup)...${NC}"
    npm install
fi

# Check for Bot Token
if [ -f ".env" ]; then
    source .env
    if [[ -z "$TELEGRAM_BOT_TOKEN" || "$TELEGRAM_BOT_TOKEN" == "7744874941:AAH8eS6r2g1X6E8Z9v9W_8b7X5c4V3b2N1M" ]]; then
        print_error "Telegram Bot Token is missing or placeholder value is found in telegram-bot/.env"
        echo -e "  ${YELLOW}Please update TELEGRAM_BOT_TOKEN in telegram-bot/.env with a valid token from @BotFather.${NC}"
        # We don't exit, but we warn
    fi
else
    print_error "telegram-bot/.env file not found."
    cd ..
    exit 1
fi

cd ..
print_success "Telegram Bot is ready."

echo ""
echo -e "${MAGENTA}${BOLD}🚀 LAUNCHING SERVICES CONCURRENTLY${NC}"
echo -e "------------------------------------------------------------------------------------------"

# 3. Synchronized Launch with Prefixed Logs
# We use a more robust way to handle prefixes and colors

# Start Frontend Logs
(npm run dev --prefix "frontend" 2>&1 | while read line; do echo -e "${CYAN}[WEB]${NC} $line"; done) &

# Start Bot Logs
(npm run dev --prefix "telegram-bot" 2>&1 | while read line; do echo -e "${MAGENTA}[BOT]${NC} $line"; done) &

echo -e "  ${GREEN}✅ Website:${NC} http://localhost:5173"
echo -e "  ${GREEN}✅ Bot:    ${NC} Active (awaiting messages)"
echo ""
echo -e "${YELLOW}${BOLD}💡 PRO TIP:${NC} Press ${BOLD}Ctrl+C${NC} to gracefully stop everything."
echo -e "------------------------------------------------------------------------------------------"

# Keep script alive and wait for background processes
wait
