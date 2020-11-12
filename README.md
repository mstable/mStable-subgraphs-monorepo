# mStable Subgraphs

Organic, farm fresh subgraphs, all in one handy repo.


## Installation

This project uses [Yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) and [Lerna](https://github.com/lerna/lerna).

```bash
yarn
yarn lerna bootstrap
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


