# mStable Subgraph Utilities

Utilities for Subgraphs... and the people who love them

Inspired by the [Curve Subgraph](https://github.com/protofire/curve-subgraph)

## Entities

### `Counter`

Simple entity for tracking integer values that increment/decrement.

Usage examples:

- Total transfers of a token
- Total transactions with a given log

### `Metric`

Similar to `Counter`, a glorified `BigDecimal` with separate fields for usability, and methods for incrementing/decrementing/etc.

Usage examples:

- Total supply of a token
- Vault balances
- APY values

### `Token`

A standard ERC-20 token, with metrics for total supply, total burned and total minted.

### `Transaction` (interface only)

Not an entity; just an interface with some convenience methods for creating entities representing transaction logs.

## Subgraph manifest

This package includes a subgraph manifest purely for the sake of generating types for interfaces. Ideally, `@graphprotocol/graph-cli` could be used to perform codegen without bootstrapping a subgraph project.
