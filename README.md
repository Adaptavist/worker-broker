# Worker Broker

**THIS IS VERY EXPERIMENTAL**

The idea is to allow multiple untrusted code modules to act like microservices,
interacting with each other via a 'WorkerBroker' with very low latencies.

The individual worker modules have to trust the broker, but don't have to
trust each other.

## Modules

- src/broker - main broker modules, to be used by the core of the system, NOT by worker code.
- src/worker - utilities for use by worker code.
