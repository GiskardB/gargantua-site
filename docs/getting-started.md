# Getting Started

**Gargantua** is an AI agent framework with two ways to ship an agent. **Runtime mode**
(recommended, no Java): declare an agent as a `manifest.yaml` + `SKILL.md`, download the
runtime, run it. **Library mode**: add `agent-engine` as a Maven dependency and write
Java. Both run the same engine underneath — routing, memory, guardrails, streaming, cost
tracking behave identically either way. See [Delivery Modes](#delivery-modes) for the
full comparison.

This guide walks through both, Runtime mode first.

---

## Option A — Runtime mode: a bundle, no Java code

### Prerequisites

- **Java 21+** (to run the downloaded jar) *(or Docker, to run the image instead)*
- An OpenAI-compatible API key *(or any LangChain4j-supported provider)*

### 1. Download the runtime

`agent-runtime` isn't on Maven Central yet — every tagged release attaches a ready-to-run
jar to its GitHub Release instead:

```bash
curl -LO https://github.com/GiskardB/gargantua/releases/latest/download/gargantua-runtime.jar
```

Prefer a container? Same release, no build step either:

```bash
docker pull ghcr.io/giskardb/gargantua-runtime:latest
```

### 2. Describe the agent — `manifest.yaml`

No code — this file plus a skill (next step) fully describe the agent. It composes with
[PACT](https://github.com/GiskardB/PACT), an open, vendor-neutral agent-description spec
(the `cognition` / `contract` / `interfaces` sections below are PACT fields; see
[Agent Manifest](https://github.com/GiskardB/gargantua/blob/main/docs/architecture/agent-manifest.md)
for the full schema):

```yaml
apiVersion: gargantua.ai/v1
kind: Agent

metadata:
  name: order-agent
  version: 1.0.0
  description: Handles customer order status and cancellations

spec:
  capabilities:
    - name: manage-orders
      description: Handles order status and cancellations
      implementedBy: order-skill
  defaultSkill: order-skill
```

### 3. Declare a skill — `SKILL.md`

Skills follow the open **[Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)**
format — YAML frontmatter for routing metadata, a Markdown body for the system prompt.
It's not a Gargantua-specific format: any tool that understands Agent Skills can read
this file, and Gargantua's own skill authoring adds only a few optional frontmatter
fields on top (see [Skills & Routing](#skills-and-routing) for all of them).

```markdown
---
name: order-skill
description: >
  Manages customer orders. Use when the user asks about order status,
  tracking, or cancellations. Do NOT use for product queries.
version: 1.0.0
---

## Role
You are an order management assistant.

## Behavior
- Always verify the order ID via tools before responding
- Never cancel without explicit user confirmation
- Provide tracking links when available
```

Put both files in one folder:

```
my-agent/
├── manifest.yaml
└── skills/
    └── order-skill/
        └── SKILL.md
```

### 4. Run it

The runtime is configured entirely through **environment variables** — which LLM
provider to use, routing strategy, audit settings, and more. This example sets only the
required ones; the [full reference is in the main README](https://github.com/GiskardB/gargantua#environment-variables-reference).

```bash
LLM_PRIMARY_PROVIDER=openai \
LLM_PRIMARY_MODEL=gpt-4o \
LLM_PRIMARY_API_KEY=sk-your-key \
LLM_PRIMARY_ENDPOINT=https://api.openai.com/v1 \
java -jar gargantua-runtime.jar run my-agent --spring.profiles.active=embedded
```

Or with Docker, mounting the same folder read-only:

```bash
docker run -p 8080:8080 -v ./my-agent:/bundle:ro \
  -e LLM_PRIMARY_API_KEY=sk-your-key \
  ghcr.io/giskardb/gargantua-runtime:latest
```

### 5. Talk to your agent

```bash
curl -X POST http://localhost:8080/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "X-User-Id: me" -H "X-Session-Id: s1" \
  -d '{"message": "Hello, what can you do?"}'
```

That's a running agent — skill routing, guardrails, memory, streaming, a REST API —
described in two files, zero Java. `java -jar gargantua-runtime.jar validate my-agent`
parses and verifies a bundle without starting anything, useful as a pre-deploy CI gate.

Real tools instead of a demo skill come from **MCP servers** named in the manifest — see
[Delivery Modes → Runtime mode](#delivery-modes) for a tool-bearing example.

---

## Option B — Library mode: add Gargantua to a Java project

Use this when tools need to call your own services or an existing domain model, or the
agent is a feature inside a larger application.

### Prerequisites

- **Java 21+** — the framework uses Virtual Threads (Project Loom)
- **Maven 3.9+**
- An OpenAI-compatible API key *(or any LangChain4j-supported provider)*
- *(Optional)* **Docker & Docker Compose** — for MongoDB, Redis, and Ollama in standard mode

### 1. Generate a new agent project

The archetype lives on Maven Central along with the rest of the framework — no `settings.xml` edit, no extra `<repository>` block.

```bash
mvn archetype:generate \
  -DarchetypeGroupId=io.github.giskardb \
  -DarchetypeArtifactId=agent-archetype \
  -DarchetypeVersion=1.4.4 \
  -DgroupId=com.mycompany -DartifactId=my-agent \
  -Dversion=1.0.0 -DagentName=MyAgent -DinteractiveMode=false
```

<details>
<summary>Need a snapshot or branch build? Use JitPack (optional)</summary>

JitPack ships **every commit** (including untagged branches and `develop-SNAPSHOT`). Because `maven-archetype-plugin` ignores `-DarchetypeRepository` when resolving the archetype itself, the JitPack repository must live in `~/.m2/settings.xml`:

```xml
<settings>
  <profiles>
    <profile>
      <id>jitpack</id>
      <repositories>
        <repository><id>jitpack.io</id><url>https://jitpack.io</url></repository>
      </repositories>
      <pluginRepositories>
        <pluginRepository><id>jitpack.io</id><url>https://jitpack.io</url></pluginRepository>
      </pluginRepositories>
    </profile>
  </profiles>
  <activeProfiles><activeProfile>jitpack</activeProfile></activeProfiles>
</settings>
```

Then generate with the JitPack coordinates (note the `v` prefix on the version):

```bash
mvn archetype:generate \
  -DarchetypeGroupId=com.github.giskardb.gargantua \
  -DarchetypeArtifactId=agent-archetype \
  -DarchetypeVersion=v1.4.4 \
  -DgroupId=com.mycompany -DartifactId=my-agent \
  -Dversion=1.0.0 -DagentName=MyAgent -DinteractiveMode=false
```

For released tags you don't need this — Maven Central serves the archetype too.

</details>

This generates a Maven project with:

```
my-agent/
├── pom.xml                          # depends on Gargantua engine
├── .env.example                     # documented env vars template
├── src/main/java/com/mycompany/
│   ├── MyAgentApplication.java      # @SpringBootApplication
│   └── tools/
│       └── SampleTool.java          # example @AgentTool
└── src/main/resources/
    ├── application.yml              # full config with defaults
    ├── application-embedded.yml     # embedded mode (no Docker needed)
    └── skills/
        ├── default-skill/SKILL.md   # fallback skill
        └── sample-skill/SKILL.md    # example skill
```

### 2. Run it (embedded mode — no Docker)

```bash
cd my-agent
LLM_PRIMARY_PROVIDER=openai \
LLM_PRIMARY_MODEL=gpt-4o \
LLM_PRIMARY_API_KEY=sk-your-key \
LLM_PRIMARY_ENDPOINT=https://api.openai.com/v1 \
SPRING_PROFILES_ACTIVE=embedded \
mvn spring-boot:run
```

### 3. Talk to your agent

```bash
curl -X POST http://localhost:8080/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "X-User-Id: me" -H "X-Session-Id: s1" -H "X-Tenant-Id: acme" \
  -d '{"message": "Hello, what can you do?"}'
```

That's a running agent with skill routing, guardrails, memory, streaming, and a REST API. Read on to add your own tools and skills.

---

## OpenAI-compatible providers

Both modes work with any OpenAI-compatible endpoint:

| Provider     | `LLM_PRIMARY_PROVIDER` | `LLM_PRIMARY_ENDPOINT` |
|--------------|------------------------|--------------------------|
| OpenAI       | `openai`               | `https://api.openai.com/v1` |
| Anthropic    | `anthropic`            | *(default)* |
| Azure OpenAI | `azure-openai`         | `https://your-resource.openai.azure.com` |
| Ollama       | `ollama`               | `http://localhost:11434` |
| LiteLLM      | `openai`               | `http://localhost:4000` |
| vLLM         | `openai`               | `http://localhost:8000` |

Add **Google Gemini, Mistral, Cohere, AWS Bedrock**, etc. by including the corresponding LangChain4j module dependency (Library mode). See [LLM Configuration](#llm-configuration) for details.

---

## Library mode: full setup (with persistent storage)

For production-like setups with persistent memory, chat history, and a local routing model, continuing from Option B above.

### 1. Generate the project

Use the same `mvn archetype:generate` command from Option B, step 1 above.

### 2. Start infrastructure

```bash
cd my-agent
docker compose up -d mongo redis ollama

# Pull the local routing model (one-time)
docker compose exec ollama ollama pull phi4-mini
```

| Service     | What it does                                                      | Port  |
|-------------|-------------------------------------------------------------------|-------|
| **MongoDB** | Chat history, session summaries, user profiles, costs              | 27017 |
| **Redis**   | Session memory, HITL approvals, tool cache, rate limits            | 6379  |
| **Ollama**  | Local routing model (zero API cost for routing & summaries)        | 11434 |

### 3. Configure your LLM providers

Gargantua uses **three LLM roles** — each can be a different provider and model:

| Role         | Purpose                                              | Default                                  | Cost                |
|--------------|-------------------------------------------------------|-------------------------------------------|---------------------|
| **Primary**  | Agent conversations — answers the user               | OpenAI `gpt-4o`                          | Per-token API cost  |
| **Fallback** | Auto-failover when primary fails                     | Anthropic `claude-sonnet-4-20250514`     | Per-token (only on failure) |
| **Routing**  | Internal: skill routing, session summaries           | Same as primary (override with `LLM_ROUTING_*`) | Per-token, unless overridden |

Copy `.env.example` to `.env` and fill in the primary provider. The **full environment
variable reference — every variable, both LLM roles, infrastructure, routing, audit — is
in the main README**: [Environment Variables Reference](https://github.com/GiskardB/gargantua#environment-variables-reference).

```bash
# ── Primary LLM — the model that answers users ──────────────────
export LLM_PRIMARY_PROVIDER=openai
export LLM_PRIMARY_MODEL=gpt-4o
export LLM_PRIMARY_API_KEY=sk-your-key-here
export LLM_PRIMARY_ENDPOINT=https://api.openai.com/v1

# ── Fallback — optional, auto-failover on primary failure ───────
# export LLM_FALLBACK_PROVIDER=azure-openai
# export LLM_FALLBACK_MODEL=gpt-4o
# export LLM_FALLBACK_API_KEY=your-azure-key
# export LLM_FALLBACK_ENDPOINT=https://your-resource.openai.azure.com

# ── Routing — rides on LLM_PRIMARY_* by default, no config needed ──
# Override only to route on a separate (e.g. free local Ollama) model:
# export LLM_ROUTING_PROVIDER=ollama
# export LLM_ROUTING_MODEL=phi4-mini
# export LLM_ROUTING_ENDPOINT=http://localhost:11434
```

### 4. Run

```bash
mvn spring-boot:run
```

### 5. Test

```bash
# Chat via REST
curl -X POST http://localhost:8080/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user1" -H "X-Session-Id: sess1" -H "X-Tenant-Id: acme" \
  -d '{"message": "Hello, what can you do?"}'

# See what skills are available
curl http://localhost:8080/.well-known/agent.json

# Chat web UI (dark theme, SSE streaming)
open http://localhost:8080/chat

# Interactive API docs
open http://localhost:8080/swagger-ui
```

---

## Library mode: add a Tool, add a Skill

Once the project runs, you extend the agent in two pieces: **tools** (Java methods) and **skills** (Markdown files or `@AgentSkill` classes). *(Runtime mode doesn't have this step — tools come from MCP servers named in the manifest instead; see Option A above.)*

### Write a Tool

```java
@Component
public class OrderTool {

    @AgentTool(description = "Retrieves order status by order ID")
    @ToolRetry(maxAttempts = 3, waitDurationMs = 500)
    @CacheableToolResult(ttlSeconds = 60, scope = CacheScope.USER)
    public OrderStatus getOrderStatus(String orderId) {
        return orderService.getStatus(orderId);
    }

    @AgentTool(description = "Cancels an order — irreversible")
    @RequiresApproval(message = "Cancel order?", showParameters = {"orderId"}, dangerous = true)
    public CancelResult cancelOrder(String orderId) {
        return orderService.cancel(orderId);
    }
}
```

### Write a Skill

Create `src/main/resources/skills/order-skill/SKILL.md` — same
[Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
format as Runtime mode's skills, since it's the same engine reading it either way:

```markdown
---
name: order-skill
description: >
  Manages customer orders. Use when the user asks about order status,
  tracking, or cancellations. Do NOT use for product queries.
version: 1.0.0
allowed-tools:
  - getOrderStatus
  - cancelOrder
metadata:
  active: true
  domain: ecommerce
---

## Role
You are an order management assistant.

## Behavior
- Always verify the order ID via tools before responding
- Never cancel without explicit user confirmation
- Provide tracking links when available

## Scope
Order-related queries only.
```

That's it. The framework handles routing, memory, guardrails, streaming, and everything else.

> Continue with [Skills & Routing](#skills-and-routing) to see all the SKILL.md options, and [Tools & Annotations](#tools-and-annotations) for retry, caching, and HITL approval patterns.

---

## Library mode: Maven coordinates

Gargantua publishes to **two channels**. Pick the one that suits your stage:

| Channel | When to use | Coordinates                              | Versioning |
|---------|-------------|------------------------------------------|------------|
| **Maven Central** | Production — signed artifacts, immutable releases, no extra `<repository>` block. | `io.github.giskardb:agent-*` | semver, no prefix (`1.4.4`) |
| **JitPack** | Snapshots, intermediate tags, `develop-SNAPSHOT`, branch builds — built on-demand at the consumer end. | `com.github.giskardb.gargantua:agent-*` | mirrors Git tags (`v1.4.4`) |

Both serve **the same source code** for tagged releases; the choice is purely operational.

### Maven Central (recommended)

```xml
<properties>
    <gargantua.version>1.4.4</gargantua.version>
</properties>

<dependencies>
    <!-- Core engine: orchestrator, guardrails, routing, memory, REST API -->
    <dependency>
        <groupId>io.github.giskardb</groupId>
        <artifactId>agent-engine</artifactId>
        <version>${gargantua.version}</version>
    </dependency>

    <!-- Optional: MCP server gateway for Claude Desktop / Cursor -->
    <dependency>
        <groupId>io.github.giskardb</groupId>
        <artifactId>agent-mcp-server</artifactId>
        <version>${gargantua.version}</version>
    </dependency>
</dependencies>
```

No `<repositories>` entry needed — Maven Central is queried by default.

### JitPack (snapshots and intermediate builds)

```xml
<properties>
    <gargantua.version>v1.4.4</gargantua.version>
</properties>

<repositories>
    <repository>
        <id>jitpack.io</id>
        <url>https://jitpack.io</url>
    </repository>
</repositories>

<dependencies>
    <dependency>
        <groupId>com.github.giskardb.gargantua</groupId>
        <artifactId>agent-engine</artifactId>
        <version>${gargantua.version}</version>
    </dependency>
</dependencies>
```

Use JitPack for `develop-SNAPSHOT` or for fix branches that have not yet been tagged.

### Available artifacts

All nine modules publish to Maven Central; `agent-bundle`, `agent-mcp-client` and
`agent-runtime` (Runtime mode's modules) are what Option A above downloads pre-built —
you only need Maven coordinates for Library mode.

| Artifact | Maven Central groupId | JitPack groupId | Description |
|----------|------------------------|------------------|-------------|
| `agent-core` | `io.github.giskardb` | `com.github.giskardb.gargantua` | Pure domain: records, interfaces, annotations. Zero Spring deps. |
| `agent-memory-sdk` | `io.github.giskardb` | `com.github.giskardb.gargantua` | Standalone 3-layer memory (Redis + MongoDB). Reusable in any project. |
| `agent-engine` | `io.github.giskardb` | `com.github.giskardb.gargantua` | Auto-configuration, guardrails, routing, orchestrator, tool registry, REST controllers. |
| `agent-mcp-server` | `io.github.giskardb` | `com.github.giskardb.gargantua` | MCP Server gateway (optional). |
| `agent-skill-linter-maven-plugin` | `io.github.giskardb` | `com.github.giskardb.gargantua` | Build-time SKILL.md validation. |
| `agent-archetype` | `io.github.giskardb` | `com.github.giskardb.gargantua` | Maven archetype to scaffold new agent projects. |

> The archetype is on **both** channels. Default to the Maven Central coordinates (`io.github.giskardb:agent-archetype:1.4.4`) — no `settings.xml` needed. Fall back to the JitPack coordinates (`com.github.giskardb.gargantua:agent-archetype:v1.4.4`) only when you need a snapshot or branch build that isn't on Central yet.

---

## Embedded mode vs. standard mode

Embedded mode runs an agent with **zero infrastructure** — perfect for development, CI, demos, and learning the framework. Applies to both delivery modes.

| What                  | Standard mode | Embedded mode |
|-----------------------|---------------|---------------|
| Working memory        | Redis         | ConcurrentHashMap |
| Episodic memory       | MongoDB       | ConcurrentHashMap |
| Knowledge memory      | MongoDB       | ConcurrentHashMap |
| Chat history          | MongoDB       | *(not available)* |
| HITL approvals        | Redis         | ConcurrentHashMap |
| Tool cache            | Redis         | *(not available)* |
| Cost tracking         | MongoDB       | *(not available)* |
| Audit trail           | MongoDB       | ConcurrentHashMap |
| Requires Docker       | Yes           | **No** |
| Data persisted        | Yes           | **No** (lost on restart) |

**When to use embedded:** local dev, prototyping, CI, demos.
**When NOT to use:** production, load testing.

```bash
# Runtime mode:
java -jar gargantua-runtime.jar run my-agent --spring.profiles.active=embedded

# Library mode, any generated project:
SPRING_PROFILES_ACTIVE=embedded mvn spring-boot:run
```

---

## Tech stack

| Component         | Version              |
|-------------------|----------------------|
| Java              | 25 (Virtual Threads) |
| Spring Boot       | 4.1.0                |
| Spring Framework  | 7.0.5                |
| LangChain4j       | 1.12.1               |
| MongoDB           | 8.0                  |
| Redis             | 7.4                  |
| springdoc-openapi | 3.1.0                |
| Resilience4j      | 2.3.0                |
| Caffeine          | 3.2.0                |
| MCP SDK           | 0.9.0                |
| GraalVM           | 21                   |

---

## Where to next?

- **[Delivery Modes](#delivery-modes)** — Runtime vs. Library, in depth
- **[Skills & Routing](#skills-and-routing)** — declarative `SKILL.md`, hybrid semantic + LLM routing
- **[Tools & Annotations](#tools-and-annotations)** — `@AgentTool`, `@ToolRetry`, `@CacheableToolResult`, HITL (Library mode) + MCP tool sources (both modes)
- **[Agent DSL](#agent-dsl)** — `@AgentSkill` in Java + `@AgentsFlow` multi-step pipelines (Library mode)
- **[Memory System](#memory-system)** — 3-layer working / episodic / knowledge memory
- **[Guardrails](#guardrails)** — PII, prompt-injection, rate limit, schema, RBAC
- **[LLM Configuration](#llm-configuration)** — multi-provider routing, failover, model catalogs
- **[Architecture Diagrams](#architecture-diagrams)** — animated request journey through the framework
- **[PACT](#pact)** — the open agent-description spec the manifest composes with
