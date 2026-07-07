---
name: use-dev-wrapper-for-development-compose
description: "Use a project's dev wrapper instead of raw Docker Compose for development or testing compose commands."
condition: "direct Docker Compose command for a development or test service when a project dev wrapper exists"
scope: "tool:bash"
---

When a project provides a `dev` wrapper, use it for development and testing Docker Compose commands. The wrapper selects the correct compose files, profiles, environment, and service wiring. Only use raw Docker Compose for explicitly local production-build validation or when no project wrapper exists.
