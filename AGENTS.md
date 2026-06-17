# AGENTS.md

# EasyQueue

EasyQueue is a desktop application inspired by Postman, but for message brokers.

The goal is to help developers inspect, publish and debug queue messages using a unified interface.

The application is intended to run locally.

---

# Product Vision

EasyQueue is a developer tool.

It should feel similar to:

* Postman
* DBeaver
* Insomnia

The user should be able to connect to a broker and immediately start working.

The project values developer experience over enterprise architecture.

---

# Philosophy

Always prefer:

* simplicity
* readability
* maintainability

Avoid:

* DDD
* Clean Architecture
* CQRS
* Repositories
* Use Cases
* Service layers
* Generic abstractions without immediate value
* Dependency Injection frameworks

Only introduce abstractions when there is a real use case.

---

# Architecture

The application is divided into:

```text
apps/
    desktop/

packages/
    core/
    provider-sqs/
    provider-rabbitmq/
    shared/
```

Dependencies:

```text
core
    ↑

providers
    ↑

desktop
```

Rules:

* core must never depend on providers
* providers may depend on core
* desktop may depend on everything
* shared must not depend on providers

---

# Core

Core contains only common contracts.

Core should stay very small.

Current interfaces:

* QueueClient
* QueueMessage
* Connection

Do not create registries, managers or factories unless explicitly requested.

---

# QueueClient

QueueClient is the main abstraction.

Every provider must implement it.

Responsibilities:

* connect
* disconnect
* listQueues
* publish
* startListening
* stopListening
* emit normalized messages

The desktop application should never know provider implementation details.

---

# Message Model

All providers must normalize incoming messages.

Internal model:

```ts
QueueMessage
```

Provider SDK objects must never leak into the UI.

If necessary, store the original provider object inside:

```ts
raw
```

---

# Providers

Every provider should be isolated.

A provider is responsible for:

* authentication
* connection
* publishing
* listening
* mapping provider objects to QueueMessage

Authentication should use the natural mechanism of each platform.

Examples:

AWS:

* default credential chain
* explicit credentials only if provided

RabbitMQ:

* URI

---

# Listening

Do not use cron jobs.

Use the native mechanism of each broker.

Examples:

SQS:

* long polling

RabbitMQ:

* channel.consumes

The UI should not know how listening works.

---

# UI

The UI should remain simple.

Main pages:

* Connections
* Queues
* Messages
* Publisher

Avoid complex state management unless necessary.

Prefer local state.

---

# Coding Style

Prefer:

* interfaces
* composition
* small classes
* explicit names
* small files

Avoid:

* inheritance hierarchies
* giant utility classes
* helper functions with generic names
* premature optimization

---

# Dependencies

Prefer lightweight dependencies.

Before adding a library, consider whether the functionality can be implemented with the standard library.

---

# Testing

Prefer unit tests for provider behavior.

Avoid overengineering test infrastructure.

---

# Refactoring

When modifying existing code:

* preserve simplicity
* reduce duplication
* remove dead code
* avoid introducing new layers

Refactor only when it improves readability.

---

# AI Agent Instructions

Before implementing any feature:

1. Understand the simplest solution.
2. Check whether an abstraction already exists.
3. Avoid creating new architectural layers.
4. Keep the project plugin-friendly.
5. Generate code that a single developer can easily maintain.

If multiple solutions exist, always choose the simpler one.
