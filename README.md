# mStable Subgraph

A subgraph for [mStable contracts](https://github.com/mstable/mStable-contracts) on [The Graph](http://thegraph.com/).

---

## Setup

### Prerequisites

First, ensure these are installed:

- [Ganache](https://www.trufflesuite.com/ganache)
- [Truffle](https://www.trufflesuite.com/truffle)
- [Docker](https://docs.docker.com/install)

Next, ensure the Docker daemon is running.

After that, clone [the Graph Node project](https://github.com/graphprotocol/graph-node) locally,
and navigate to the `docker` directory in that project (e.g. `cd graph-node/docker`).

If you're on Linux, run `./setup.sh` in that directory to set the host IP address in the docker config.

At this point, it should be possible to run the node: `docker-compose up`. Check that its services are running in the logs (GraphQL, Postgres, and IPFS).

Finally, run Ganache on `http://0.0.0.0:7545` such that it is available to running Docker images (`ganache-cli -p 7545 -h 0.0.0.0`)

### Installation

1. `yarn`
2. `yarn prepare:<config>` (i.e `ropsten`, `kovan`, `local`, `staging`, `mainnet`)
3. `yarn codegen`

### Development

Firstly, the subgraph can be created by running: `yarn create:local`; this should lead to a number of logs on the graph node.

Once the subgraph has been created, it can be deployed at any time with: `yarn deploy:local`.

This will cause the graph to start processing blocks and mapping events. Eventually, the
subgraph will have been (re)created.

If changes are made to the contracts, `subgraph.yaml`, or the GraphQL schema, run `yarn codegen`;
this re-create the `generated` folder.

**NB:** Type-checking is performed at build time; `yarn tsc` won't work.

---

## Deployment

1. `yarn`
2. Ensure correct config in `/config/<config>.json`
3. `yarn prepare:<config>`
4. `yarn codegen`
5. `yarn deploy:<config> <access token>`
