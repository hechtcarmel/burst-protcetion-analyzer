#!/bin/bash

###############################################################################
# Burst Protection Analysis Dashboard - Complete Setup Script
###############################################################################
# This script handles:
# - Node.js installation verification
# - pnpm installation
# - Dependency installation
# - Environment configuration (Vertica credentials)
# - Building the application
# - Running the application
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default Vertica configuration
DEFAULT_VERTICA_HOST="office-vrt.taboolasyndication.com"
DEFAULT_VERTICA_PORT="5433"
DEFAULT_VERTICA_DATABASE="taboola_prod"
DEFAULT_VERTICA_CONNECTION_TIMEOUT="10000"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BLUE}Burst Protection Analysis Dashboard - Setup${NC}          ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

###############################################################################
# Check Node.js
###############################################################################

check_node() {
    print_section "Checking Node.js Installation"

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js is installed: $NODE_VERSION"

        # Check if version is 20 or higher
        NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)
        if [ "$NODE_MAJOR" -ge 20 ]; then
            print_success "Node.js version is compatible (requires v20+)"
        else
            print_warning "Node.js version $NODE_VERSION detected. Version v20+ is recommended."
        fi
        return 0
    else
        print_error "Node.js is not installed"
        echo ""
        print_info "Please install Node.js v20+ before running this script:"
        echo ""
        print_info "macOS:   ${CYAN}brew install node${NC}"
        print_info "Ubuntu:  ${CYAN}curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs${NC}"
        print_info "Manual:  ${CYAN}https://nodejs.org/en/download/${NC}"
        echo ""
        exit 1
    fi
}

###############################################################################
# Check/Install pnpm
###############################################################################

check_pnpm() {
    print_section "Checking pnpm Installation"

    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm -v)
        print_success "pnpm is installed: v$PNPM_VERSION"
        return 0
    else
        print_warning "pnpm is not installed"
        return 1
    fi
}

install_pnpm() {
    print_section "Installing pnpm"
    print_info "Installing pnpm via npm..."
    npm install -g pnpm
    print_success "pnpm installed successfully"
}

###############################################################################
# Install Dependencies
###############################################################################

install_dependencies() {
    print_section "Installing Project Dependencies"
    print_info "Running: pnpm install"

    if pnpm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

###############################################################################
# Configure Environment
###############################################################################

configure_environment() {
    print_section "Configuring Vertica Database Connection"

    # Check if .env.local already exists
    if [ -f .env.local ]; then
        print_warning ".env.local already exists"
        echo -n "Do you want to reconfigure? (y/n): "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_info "Keeping existing configuration"
            return 0
        fi

        # Backup existing file
        cp .env.local .env.local.backup
        print_info "Backed up existing .env.local to .env.local.backup"
    fi

    echo ""
    print_info "Please provide Vertica database credentials"
    print_info "Press Enter to use default values shown in [brackets]"
    echo ""

    # Host
    echo -n "Vertica Host [$DEFAULT_VERTICA_HOST]: "
    read -r VERTICA_HOST
    VERTICA_HOST=${VERTICA_HOST:-$DEFAULT_VERTICA_HOST}

    # Port
    echo -n "Vertica Port [$DEFAULT_VERTICA_PORT]: "
    read -r VERTICA_PORT
    VERTICA_PORT=${VERTICA_PORT:-$DEFAULT_VERTICA_PORT}

    # Database
    echo -n "Vertica Database [$DEFAULT_VERTICA_DATABASE]: "
    read -r VERTICA_DATABASE
    VERTICA_DATABASE=${VERTICA_DATABASE:-$DEFAULT_VERTICA_DATABASE}

    # Username (no default)
    echo -n "Vertica Username: "
    read -r VERTICA_USER
    while [ -z "$VERTICA_USER" ]; do
        print_warning "Username is required"
        echo -n "Vertica Username: "
        read -r VERTICA_USER
    done

    # Password (no default, hidden input)
    echo -n "Vertica Password: "
    read -rs VERTICA_PASSWORD
    echo ""
    while [ -z "$VERTICA_PASSWORD" ]; do
        print_warning "Password is required"
        echo -n "Vertica Password: "
        read -rs VERTICA_PASSWORD
        echo ""
    done

    # Connection timeout
    echo -n "Connection Timeout (ms) [$DEFAULT_VERTICA_CONNECTION_TIMEOUT]: "
    read -r VERTICA_CONNECTION_TIMEOUT
    VERTICA_CONNECTION_TIMEOUT=${VERTICA_CONNECTION_TIMEOUT:-$DEFAULT_VERTICA_CONNECTION_TIMEOUT}

    # Write to .env.local
    cat > .env.local << EOF
VERTICA_HOST=$VERTICA_HOST
VERTICA_PORT=$VERTICA_PORT
VERTICA_DATABASE=$VERTICA_DATABASE
VERTICA_USER=$VERTICA_USER
VERTICA_PASSWORD=$VERTICA_PASSWORD
VERTICA_CONNECTION_TIMEOUT=$VERTICA_CONNECTION_TIMEOUT
EOF

    print_success "Configuration saved to .env.local"

    # Test connection
    echo ""
    echo -n "Would you like to test the database connection? (y/n): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        test_database_connection
    fi
}

test_database_connection() {
    print_section "Testing Database Connection"
    print_info "Building the project first (required for testing)..."

    # Build the project quietly
    if pnpm build > /dev/null 2>&1; then
        print_success "Build successful"

        print_info "Starting server temporarily to test connection..."
        # Start the server in the background
        pnpm start > /tmp/burst-protection-server.log 2>&1 &
        SERVER_PID=$!

        # Wait for server to start
        sleep 5

        # Test the connection
        print_info "Testing connection to http://localhost:3000/api/test-db..."

        if curl -s -f http://localhost:3000/api/test-db > /tmp/burst-protection-test.json 2>&1; then
            SUCCESS=$(cat /tmp/burst-protection-test.json | grep -o '"success":[^,}]*' | cut -d: -f2)
            if [ "$SUCCESS" = "true" ]; then
                print_success "Database connection successful!"
            else
                print_error "Database connection failed"
                cat /tmp/burst-protection-test.json
            fi
        else
            print_error "Failed to connect to server"
            print_info "Server logs:"
            tail -20 /tmp/burst-protection-server.log
        fi

        # Stop the server
        kill $SERVER_PID 2>/dev/null || true
        sleep 2

        # Cleanup
        rm -f /tmp/burst-protection-server.log /tmp/burst-protection-test.json
    else
        print_error "Build failed. Cannot test connection."
        print_info "Please fix any build errors and try again."
    fi
}

###############################################################################
# Build Application
###############################################################################

build_application() {
    print_section "Building Application"
    print_info "Running: pnpm build"
    print_warning "This may take a few minutes..."

    if pnpm build; then
        print_success "Application built successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

###############################################################################
# Run Application
###############################################################################

run_application() {
    print_section "Starting Application"

    echo ""
    print_info "Choose how to run the application:"
    echo "  1) Development mode (with hot reload)"
    echo "  2) Production mode (optimized build)"
    echo -n "Enter choice (1 or 2): "
    read -r choice

    case $choice in
        1)
            print_info "Starting development server..."
            print_info "The application will be available at: ${CYAN}http://localhost:3000${NC}"
            print_info "Press Ctrl+C to stop"
            echo ""
            pnpm dev
            ;;
        2)
            print_info "Starting production server..."
            print_info "The application will be available at: ${CYAN}http://localhost:3000${NC}"
            print_info "Press Ctrl+C to stop"
            echo ""
            pnpm start
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

###############################################################################
# Main Setup Flow
###############################################################################

main() {
    print_header

    print_info "This script will set up the Burst Protection Analysis Dashboard"
    print_info "The setup process includes:"
    print_info "  1. Checking/Installing Node.js (v20+)"
    print_info "  2. Checking/Installing pnpm"
    print_info "  3. Installing project dependencies"
    print_info "  4. Configuring Vertica database connection"
    print_info "  5. Building the application"
    print_info "  6. Running the application"
    echo ""

    echo -n "Press Enter to continue or Ctrl+C to cancel..."
    read -r

    # Step 1: Check Node.js
    check_node

    # Step 2: Check/Install pnpm
    if ! check_pnpm; then
        install_pnpm
        # Verify installation
        if ! check_pnpm; then
            print_error "pnpm installation failed"
            exit 1
        fi
    fi

    # Step 3: Install dependencies
    install_dependencies

    # Step 4: Configure environment
    configure_environment

    # Step 5: Build application
    build_application

    # Step 6: Run application
    echo ""
    print_success "Setup completed successfully!"
    echo ""
    echo -n "Would you like to run the application now? (y/n): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        run_application
    else
        echo ""
        print_info "Setup complete! You can start the application later with:"
        print_info "  Development: ${CYAN}pnpm dev${NC}"
        print_info "  Production:  ${CYAN}pnpm start${NC}"
        echo ""
    fi
}

###############################################################################
# Script Entry Point
###############################################################################

# Handle script arguments
case "${1:-}" in
    --help|-h)
        print_header
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --skip-deps         Skip dependency installation"
        echo "  --skip-build        Skip building the application"
        echo "  --config-only       Only configure environment"
        echo "  --test-connection   Only test database connection"
        echo ""
        echo "Examples:"
        echo "  $0                  Full setup"
        echo "  $0 --config-only    Only configure .env.local"
        echo "  $0 --test-connection Test existing configuration"
        exit 0
        ;;
    --config-only)
        print_header
        configure_environment
        exit 0
        ;;
    --test-connection)
        print_header
        test_database_connection
        exit 0
        ;;
    --skip-deps)
        SKIP_DEPS=true
        ;;
    --skip-build)
        SKIP_BUILD=true
        ;;
esac

# Run main setup
main
