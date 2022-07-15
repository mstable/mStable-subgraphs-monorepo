# mStable Subgraphs

All [mStable](https://mstable.org) subgraphs in one handy repo.

<a href="https://www.youtube.com/watch?v=l0vrsO3_HpU"><img src="https://raw.githubusercontent.com/mstable/mStable-subgraphs-monorepo/master/graphtasia.png" width="430" /></a>

## Installation

This project uses [Yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) and [Lerna](https://github.com/lerna/lerna).

```bash
# First enable yarn workspaces if needed
yarn config set workspaces-experimental true
# Install and link
yarn
yarn lerna bootstrap --force-local && yarn lerna link --force-local
# Prepare all the subgraphs for the first time
yarn prepare:config
```

## Packages

- `@mstable/subgraph-utils`
  - Schemas/entities for shared items (e.g. Metrics, Tokens)
  - Utilities for interacting with data types and performing conversions 
  - Scripts for e.g. merging GraphQL schemas
- `@mstable/protocol-subgraph`
  - Subgraph for the mStable protocol
  - Encompasses mAssets, bAssets, saving contracts, and metrics
- `@mstable/governance-subgraph`
  - Subgraph for mStable governance contracts
  - Encompasses MTA staking, staking rewards, voting power, and metrics
- `@mstable/ecosystem-subgraph`
  - Subgraph for mStable's wider ecosystem
  - Encompasses EARN pools, Merkle drops, pool fund management, and metrics


## Development

- GraphQL types in `packages/utils` are stitched together with `yarn codegen` (in that directory).
- These types can be consumed in other packages with import comments (e.g. `# import Token`); the schema for each subgraph is created via codegen. 
- Each subgraph shares the same config (for different networks) and can be prepared and deployed for the chosen network.

### Preparing the subgraph for other networks

```bash
# Configures the subgraph for the mainnet and polygon
yarn prepare:config
# Change the network to the testnet
cd packages/protocol
yarn prepare:ropsten
```
