# PACT

Gargantua's manifest (`gargantua.ai/v1`) covers governance, deployment and runtime
concerns on its own. What it didn't have was a portable, vendor-neutral way to express
what an agent's *cognition* looks like, what basic *contract* it operates under, and how
it can be *reached* by other systems. That's what **[PACT](https://github.com/GiskardB/PACT)**
is for — a small, independent specification with its own repository, not owned by or
specific to Gargantua.

> **Read the spec:** [github.com/GiskardB/PACT](https://github.com/GiskardB/PACT) —
> [SPECIFICATION.md](https://github.com/GiskardB/PACT/blob/main/SPECIFICATION.md) is the
> full document (50 short sections, with a table of contents).

## Status

PACT is a **draft**, currently at version 0.4 — not a finalized industry standard. It's
designed to compose with other agent standards (A2A, MCP, ANP/ADP, and whatever
governance layer a platform already has) rather than replace them. See the spec's own
[Draft Status](https://github.com/GiskardB/PACT/blob/main/SPECIFICATION.md#50-draft-status)
and [Open Questions](https://github.com/GiskardB/PACT/blob/main/SPECIFICATION.md#47-open-questions)
sections for exactly what that means.

## What Gargantua implements

Gargantua is one implementation of PACT — using it never requires Gargantua, and
Gargantua doesn't require PACT authorship for every agent. Concretely:

- `spec.cognition`, `spec.contract` and `spec.interfaces` are real, tested fields on the
  `gargantua.ai/v1` manifest (`core.pact` in `agent-core`), covering PACT's Cognition,
  Contract and Interfaces pillars.
- Every running agent serves its own PACT Core projection live at
  `GET /.well-known/pact.json` — cache-controlled, not just a static file — the
  standalone counterpart to the A2A Agent Card at `/.well-known/agent.json`.
- `Identity` and `Purpose` (two more PACT pillars) have no dedicated manifest fields —
  they're derived from `metadata.owner` and `metadata.description`, which already answer
  close-enough questions.

The full field-by-field mapping onto PACT's seven pillars lives in the main repo's
[`docs/architecture/agent-manifest.md`](https://github.com/GiskardB/gargantua/blob/main/docs/architecture/agent-manifest.md#relationship-to-pact).

## Why it's a separate repository

PACT is meant to be vendor-neutral — describing an agent regardless of which framework
or runtime built it. Keeping it in its own repository (rather than drafted inside
Gargantua) keeps that true in practice, not just in the text: nothing about the spec
references Gargantua's internals, and nothing about adopting PACT pulls in Gargantua as
a dependency.

## Where to next?

- [Agent Manifest reference (Gargantua repo)](https://github.com/GiskardB/gargantua/blob/main/docs/architecture/agent-manifest.md) — field-by-field mapping onto PACT
- [Delivery Modes](#delivery-modes) — Runtime mode's manifest is where `cognition`/`contract`/`interfaces` are authored
- [PACT specification](https://github.com/GiskardB/PACT) — the spec itself, independent of any implementation
