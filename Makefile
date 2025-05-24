# Load environment variables from .env file
include contracts/.env

.PHONY: build test deploy-base-sepolia clean frontend backend install generate-abi

# Solidity contract commands
build:
	@echo "Building Solidity contracts..."
	cd contracts && forge build

test:
	@echo "Running Solidity tests..."
	cd contracts && forge test

coverage:
	@echo "Generating coverage report..."
	cd contracts && forge coverage

deploy-base-sepolia:
	@echo "Deploying contracts..."
	@if [ -z "${BASE_SEPOLIA_RPC_URL}" ]; then \
		echo "Error: BASE_SEPOLIA_RPC_URL not found in .env file"; \
		exit 1; \
	fi
	@echo "Using Base Sepolia RPC URL from .env"
	cd contracts && forge script script/ConfidentialWealthComparator.s.sol:DeployConfidentialWealthComparator --rpc-url ${BASE_SEPOLIA_RPC_URL} --broadcast --verify --etherscan-api-key ${ETHERSCAN_API_KEY}

# Frontend commands
frontend-install:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

start-client: frontend-install
	@echo "Starting frontend development server..."
	cd frontend && bun dev

# Backend commands
backend-install:
	@echo "Installing backend dependencies..."
	cd backend && bun install

test-e2e:
	bun run test:e2e

test-e2e-base-sepolia:
	bun run test:e2e:base-sepolia

# Generate ABI
generate-abi:
	@echo "Generating contract ABIs..."
	cd backend && npx wagmi generate

# Docker commands
docker-up:
	@echo "Starting Docker containers..."
	docker-compose up -d

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down

# Project-wide commands
install: frontend-install backend-install generate-abi
	@echo "Installing all dependencies..."

clean:
	@echo "Cleaning build artifacts..."
	rm -rf contracts/cache contracts/out
	cd frontend && rm -rf node_modules
	cd backend && rm -rf node_modules

# Help command
help:
	@echo "Available commands:"
	@echo "  make build          			- Build Solidity contracts"
	@echo "  make test          			- Run Solidity tests"
	@echo "  make deploy-base-sepolia       - Deploy contracts (requires RPC_URL)"
	@echo "  make start         			- Start frontend development server"
	@echo "  make backend-dev   			- Start backend development server"
	@echo "  make docker-up     			- Start Docker containers"
	@echo "  make docker-down   			- Stop Docker containers"
	@echo "  make install       			- Install all dependencies"
	@echo "  make clean         			- Clean build artifacts"
	@echo "  make generate-abi  			- Generate contract ABIs" 
	@echo "  make test-e2e      			- Run E2E tests"
	@echo "  make coverage      			- Generate coverage report"
	@echo "  make help          			- Show this help message"