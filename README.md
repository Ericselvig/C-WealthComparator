# Confidential Wealth Comparator

A decentralized application that allows users to compare their wealth privately using the Inco protocol. This application leverages Inco Lightning's confidential computing infrastructure to enable private wealth comparisons while maintaining confidentiality.

## Project Structure

```
.
├── contracts/
│   ├── src/
│   ├── test/
│   └── script/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── provider/
│   ├── abi/
│   └── utils/
└── backend/
    └── src/
        ├── test/
        └── generated/
```

## Setup

1. Clone the repository:

```bash
git clone https://github.com/Ericselvig/c-WealthComparator
cd c-WealthComparator
```

2. Install dependencies:

```bash
# Install all dependencies
make install
```

3. Configure environment variables:

```
   Create a `secrets.env` file in the root directory from `secrets.example.env` for contract deployment.
   Create a `.env` file in the contracts directory from `.env.example` for contract deployment.
```

## Testing

1. Run foundry tests:

```bash
make test
```

2. Run local e2e test:

```bash
make test-e2e
```

3. Run base sepolia e2e test (Need to Confifure values in secrets.env):

```bash
make test-e2e-base-sepolia
```

4. Coverage:

```bash
make coverage
```

## Development

1. Deploy the smart contract to base sepolia(requires values configured in contracts/.env):

```bash
make deploy
```

2. After deploying the contract, update the contract address in `frontend/src/components/wealth-manager.js` with the newly deployed contract address before starting the client.

3. Start the frontend:

```bash
make start-client
```

## Available Commands

```bash
make help
```

## User Flow

1. User connects wallet using the "Connect Wallet" button
2. User enters wealth amount in ETH.
3. User clicks "Submit" to encrypt and store their wealth.
4. User enters addresses to compare between.
5. User clicks "Compare" to see who has the highest wealth.

## Smart Contract

The main contract `ConfidentialWealthComparator.sol` provides the following functionality:

- `submitWealth`: Submit encrypted wealth value using Inco's encryption
- `compareWealth`: Compare wealth between multiple addresses using confidential computing
- `wealthOf`: Query encrypted wealth of an address
- `getRichestUser`: Get the address with the highest wealth
