#!/usr/bin/env python3
"""
generate_p31_dataset.py — synthetic P31 tool-calling dataset for needle-rs fine-tuning.

Produces training data in the EXACT format expected by `cactus-compute/needle`
(https://github.com/cactus-compute/needle), the upstream MIT-licensed training
code. Format (one JSON object per line):

    {"query": "...", "tools": "<json-string of tool list>", "answers": "<json-string of [{name, arguments}]>"}

CRITICAL FORMAT NOTES (verified against upstream README + needle-rs tools):
  * `tools` is a JSON-ENCODED STRING, not a raw array. Each tool uses the FLAT
    parameter schema: {"name", "description", "parameters": {param: {type, description, required}}}.
    JSON-Schema `properties` is intentionally NOT used (the needle decoder has a
    known bug with it — see needle-rs tools/gen_e2e_vectors.py).
  * `answers` is a JSON-ENCODED STRING of an ARRAY, e.g.
    "[{\"name\":\"phos_deploy\",\"arguments\":{\"surface\":\"analytics\"}}]".
  * Upstream requires >=120 examples per tool (100 train / 10 val / 10 test) to
    avoid overfitting. We generate 120 per tool here.

Usage:
    python3 generate_p31_dataset.py
Outputs:
    p31-train.jsonl      (1080 positive: 120 x 9 P31 tools, each with distractors)
    p31-negative.jsonl   (100 out-of-domain, OPTIONAL — see runbook caveat)
    p31-train.sample.jsonl (first 5 lines, for quick inspection)
"""
import json
import random

SEED = 20260712
random.seed(SEED)

PER_TOOL = 120
NEGATIVES = 100

# ── Tool catalogue (flat parameter schema, matches upstream training) ──────────
TOOLS = {
    "oasis_execute": {
        "description": "Run an Oasis CLI command or interactive experience in the P31 workspace",
        "parameters": {
            "action": {"type": "string", "description": "Oasis action to run (build, start, logs, deploy, scale)", "required": True},
            "app": {"type": "string", "description": "Target app: frontend, api, worker, database, cache", "required": False},
            "params": {"type": "string", "description": "Extra CLI flags", "required": False},
        },
    },
    "phos_adopt": {
        "description": "Adopt a PHOS surface into the workspace",
        "parameters": {
            "surface": {"type": "string", "description": "PHOS surface name to adopt (dashboard, analytics, chat, monitor)", "required": True},
        },
    },
    "jitterbug_run": {
        "description": "Run a brain-dump orchestration in Jitterbug",
        "parameters": {
            "topic": {"type": "string", "description": "Orchestration topic (memory, focus, planning, coding, research)", "required": True},
            "priority": {"type": "string", "description": "Priority: high, medium, low", "required": False},
        },
    },
    "phos_learn": {
        "description": "Train or fine-tune a PHOS model",
        "parameters": {
            "dataset": {"type": "string", "description": "Dataset name to train on", "required": True},
            "task": {"type": "string", "description": "Learning task (summarize, classify, extract, generate)", "required": False},
        },
    },
    "phos_deploy": {
        "description": "Deploy a PHOS surface to production",
        "parameters": {
            "surface": {"type": "string", "description": "PHOS surface to deploy (dashboard, analytics, chat, monitor)", "required": True},
            "config": {"type": "string", "description": "Environment: prod, staging, dev, canary", "required": False},
        },
    },
    "phos_watch": {
        "description": "Watch a PHOS surface for changes or regressions",
        "parameters": {
            "surface": {"type": "string", "description": "PHOS surface to watch (dashboard, analytics, chat, monitor)", "required": True},
            "interval": {"type": "string", "description": "Poll interval: 5s, 10s, 30s, 1m, 5m", "required": False},
        },
    },
    "healer_remediate": {
        "description": "Auto-remediate a detected fault in the system",
        "parameters": {
            "issue": {"type": "string", "description": "Fault to remediate (memory leak, cpu spike, timeout, auth failure)", "required": True},
            "service": {"type": "string", "description": "Affected service: api, worker, database, cache", "required": False},
        },
    },
    "bus_emit": {
        "description": "Emit an event on the message bus",
        "parameters": {
            "event": {"type": "string", "description": "Event name (deploy, rollback, scale, alert, heartbeat, sync)", "required": True},
            "payload": {"type": "string", "description": "JSON payload string", "required": False},
        },
    },
    "phos_rollback": {
        "description": "Roll back a PHOS deployment to a previous version",
        "parameters": {
            "surface": {"type": "string", "description": "PHOS surface to roll back (dashboard, analytics, chat, monitor)", "required": True},
            "version": {"type": "string", "description": "Target version, e.g. v1.0.0, latest", "required": False},
        },
    },
}


def tool_obj(name: str) -> dict:
    spec = TOOLS[name]
    return {"name": name, "description": spec["description"], "parameters": spec["parameters"]}


def tools_json(target: str, n_distractors: int = 3) -> str:
    """Compact JSON string of [target_tool + distractors]."""
    others = [t for t in TOOLS if t != target]
    random.shuffle(others)
    chosen = [target] + others[: n_distractors]
    random.shuffle(chosen)  # randomize target position
    return json.dumps([tool_obj(t) for t in chosen], separators=(",", ":"))


# ── Slot pools ─────────────────────────────────────────────────────────────────
SURFACES = ["dashboard", "analytics", "chat", "monitor", "reports", "search", "notifications", "settings", "profile", "alerts"]
ACTIONS = ["build", "start", "stop", "restart", "status", "logs", "scale", "update", "deploy", "rollback"]
APPS = ["frontend", "backend", "api", "worker", "database", "cache", "queue", "gateway"]
PARAMS = ["--verbose", "--force", "--dry-run", "--no-cache", "--timeout=30"]
TOPICS = ["memory", "focus", "planning", "coding", "writing", "review", "research", "design"]
PRIORITIES = ["high", "medium", "low"]
DATASETS = ["phos-data-2024", "user-feedback", "usage-logs", "synthetic-v1", "support-tickets"]
TASKS = ["summarize", "classify", "extract", "generate", "translate"]
CONFIGS = ["prod", "staging", "dev", "canary"]
INTERVALS = ["5s", "10s", "30s", "1m", "5m"]
ISSUES = ["memory leak", "cpu spike", "connection timeout", "authentication failure", "data inconsistency", "latency regression"]
SERVICES = ["api", "worker", "database", "cache", "gateway"]
EVENTS = ["deploy", "rollback", "scale", "alert", "heartbeat", "sync", "config-change"]
PAYLOADS = ['{"status":"ok"}', '{"error":"timeout"}', '{"count":42}', '{"level":"warn"}']
VERSIONS = ["v1.0.0", "v1.1.0", "v2.0.0", "latest", "v0.9.5"]

# ── Per-tool query templates + argument builders ───────────────────────────────
# Each entry: (template, builder) where builder() -> dict of arguments.
def _pick(seq):
    return random.choice(seq)


TEMPLATES = {
    "oasis_execute": [
        ("run the {action} command in oasis", lambda: {"action": _pick(ACTIONS)}),
        ("execute {action} on the oasis cluster", lambda: {"action": _pick(ACTIONS)}),
        ("i need to run {action} in the oasis environment", lambda: {"action": _pick(ACTIONS)}),
        ("start an oasis {action} session", lambda: {"action": _pick(ACTIONS)}),
        ("deploy an oasis {app} to the edge", lambda: {"app": _pick(APPS), "action": "deploy"}),
        ("run oasis {action} with {params}", lambda: {"action": _pick(ACTIONS), "params": _pick(PARAMS)}),
        ("get the {action} logs from oasis", lambda: {"action": "logs"}),
        ("scale the oasis {app} up", lambda: {"app": _pick(APPS), "action": "scale"}),
    ],
    "phos_adopt": [
        ("adopt the {surface} surface into my phos workspace", lambda: {"surface": _pick(SURFACES)}),
        ("i want to adopt {surface} in phos", lambda: {"surface": _pick(SURFACES)}),
        ("bring {surface} into my phos workspace", lambda: {"surface": _pick(SURFACES)}),
        ("add {surface} to my phos surfaces", lambda: {"surface": _pick(SURFACES)}),
        ("adopt a new phos surface called {surface}", lambda: {"surface": _pick(SURFACES)}),
        ("register the {surface} surface with phos", lambda: {"surface": _pick(SURFACES)}),
    ],
    "jitterbug_run": [
        ("run a jitterbug orchestration for {topic}", lambda: {"topic": _pick(TOPICS)}),
        ("start a brain-dump orchestration for {topic}", lambda: {"topic": _pick(TOPICS)}),
        ("jitterbug run on {topic}", lambda: {"topic": _pick(TOPICS)}),
        ("orchestrate a brain dump for {topic}", lambda: {"topic": _pick(TOPICS)}),
        ("run jitterbug for {topic} with {priority} priority", lambda: {"topic": _pick(TOPICS), "priority": _pick(PRIORITIES)}),
        ("dump my {topic} to the brain store", lambda: {"topic": _pick(TOPICS)}),
    ],
    "phos_learn": [
        ("train a phos model on {dataset}", lambda: {"dataset": _pick(DATASETS)}),
        ("fine-tune the phos model with {dataset}", lambda: {"dataset": _pick(DATASETS)}),
        ("learn a new phos capability for {task}", lambda: {"task": _pick(TASKS)}),
        ("train phos to {task}", lambda: {"task": _pick(TASKS)}),
        ("fine-tune phos model on {dataset} for {task}", lambda: {"dataset": _pick(DATASETS), "task": _pick(TASKS)}),
        ("teach phos to {task} using {dataset}", lambda: {"dataset": _pick(DATASETS), "task": _pick(TASKS)}),
    ],
    "phos_deploy": [
        ("deploy {surface} to production", lambda: {"surface": _pick(SURFACES)}),
        ("ship {surface} to prod", lambda: {"surface": _pick(SURFACES)}),
        ("deploy the phos surface {surface}", lambda: {"surface": _pick(SURFACES)}),
        ("publish {surface} to the live environment", lambda: {"surface": _pick(SURFACES)}),
        ("deploy phos surface {surface} with {config} config", lambda: {"surface": _pick(SURFACES), "config": _pick(CONFIGS)}),
        ("roll out {surface} to {config}", lambda: {"surface": _pick(SURFACES), "config": _pick(CONFIGS)}),
    ],
    "phos_watch": [
        ("watch {surface} for changes", lambda: {"surface": _pick(SURFACES)}),
        ("monitor {surface} in phos", lambda: {"surface": _pick(SURFACES)}),
        ("watch the {surface} surface", lambda: {"surface": _pick(SURFACES)}),
        ("phos watch {surface} every {interval}", lambda: {"surface": _pick(SURFACES), "interval": _pick(INTERVALS)}),
        ("start watching {surface} for regressions", lambda: {"surface": _pick(SURFACES)}),
        ("keep an eye on {surface} each {interval}", lambda: {"surface": _pick(SURFACES), "interval": _pick(INTERVALS)}),
    ],
    "healer_remediate": [
        ("fix the {issue} issue in phos", lambda: {"issue": _pick(ISSUES)}),
        ("remediate the {issue} fault", lambda: {"issue": _pick(ISSUES)}),
        ("auto-remediate {issue} in the system", lambda: {"issue": _pick(ISSUES)}),
        ("heal the {service} service", lambda: {"service": _pick(SERVICES)}),
        ("fix {issue} in the {service} service", lambda: {"issue": _pick(ISSUES), "service": _pick(SERVICES)}),
        ("repair the {service} after a {issue}", lambda: {"issue": _pick(ISSUES), "service": _pick(SERVICES)}),
    ],
    "bus_emit": [
        ("emit a {event} event on the bus", lambda: {"event": _pick(EVENTS)}),
        ("send {event} to the message bus", lambda: {"event": _pick(EVENTS)}),
        ("bus emit {event} with payload {payload}", lambda: {"event": _pick(EVENTS), "payload": _pick(PAYLOADS)}),
        ("publish {event} on the event bus", lambda: {"event": _pick(EVENTS)}),
        ("emit event {event} to the bus with {payload}", lambda: {"event": _pick(EVENTS), "payload": _pick(PAYLOADS)}),
    ],
    "phos_rollback": [
        ("roll back {surface} to previous version", lambda: {"surface": _pick(SURFACES)}),
        ("revert {surface} deployment", lambda: {"surface": _pick(SURFACES)}),
        ("rollback phos surface {surface}", lambda: {"surface": _pick(SURFACES)}),
        ("undo deployment of {surface}", lambda: {"surface": _pick(SURFACES)}),
        ("revert {surface} to version {version}", lambda: {"surface": _pick(SURFACES), "version": _pick(VERSIONS)}),
        ("roll {surface} back to {version}", lambda: {"surface": _pick(SURFACES), "version": _pick(VERSIONS)}),
    ],
}

NEGATIVE_QUERIES = [
    "what is the capital of france?",
    "tell me a joke about cats",
    "explain quantum entanglement to me",
    "what is the weather in san francisco?",
    "how do i bake a chocolate cake?",
    "who wrote the iliad?",
    "what is the speed of light in a vacuum?",
    "translate hello to spanish",
    "what is the meaning of life?",
    "calculate 2 plus 2",
    "what is the square root of pi?",
    "when was the declaration of independence signed?",
    "what is the tallest mountain on earth?",
    "how many planets are in the solar system?",
    "what is the capital of australia?",
    "who is the ceo of apple?",
    "what is the boiling point of water?",
    "what is the population of china?",
    "when did world war 2 end?",
    "what is the chemical formula for water?",
    "recommend a good science fiction novel",
    "summarize the plot of hamlet",
    "how do i change a flat tire?",
    "what are the health benefits of green tea?",
    "who painted the mona lisa?",
    "what time is it in tokyo right now?",
    "give me a recipe for lentil soup",
    "what is the distance from earth to the moon?",
    "how does photosynthesis work?",
    "what is the tallest building in the world?",
    "who discovered penicillin?",
    "what is the largest ocean on earth?",
    "how do i learn to play the guitar?",
    "what is the speed of sound?",
    "who was the first person on the moon?",
    "what is the difference between a rabbit and a hare?",
    "how many continents are there?",
    "what is the longest river in the world?",
    "who composed the ninth symphony?",
    "what is the freezing point of mercury?",
    "how do i write a haiku?",
    "what is the atomic number of gold?",
    "what is the main ingredient in guacamole?",
    "who directed the movie inception?",
    "what is the circumference of the earth?",
    "how do i meditate for beginners?",
    "what is the most spoken language in the world?",
    "what causes lightning?",
    "what is the half-life of carbon 14?",
    "who wrote the book dune?",
    "what is the smallest country in the world?",
    "how do i start a compost bin?",
    "what is the density of water?",
    "what is the fastest land animal?",
    "who is the greek god of the sea?",
    "what is the purpose of the United Nations?",
    "how do i improve my sleep quality?",
    "what is the average distance from the sun to mars?",
    "what is the function of the liver?",
    "who invented the printing press?",
    "what is the boiling point of nitrogen?",
    "how do i make cold brew coffee?",
    "what is the largest desert in the world?",
    "what is the main export of brazil?",
    "who was the first female nobel laureate?",
    "what is the speed of the fastest bird?",
    "how do i reduce my carbon footprint?",
    "what is the wavelength of visible light?",
    "who wrote the communist manifesto?",
    "what is the average human body temperature?",
    "how do i train for a marathon?",
    "what is the composition of the atmosphere?",
    "who discovered america?",
    "what is the loudest animal on earth?",
    "how do i grow tomatoes indoors?",
    "what is the gravitational constant?",
    "what is the oldest known language?",
    "who painted the sistine chapel ceiling?",
    "what is the primary color of the sky at noon?",
    "how do i build a wind turbine?",
    "what is the mass of the sun?",
    "what is the deepest ocean trench?",
    "who wrote the quran?",
    "what is the function of red blood cells?",
    "how do i start a vegetable garden?",
    "what is the speed of the国际 space station?",
    "what is the capital of canada?",
    "how do i learn japanese efficiently?",
    "what is the melting point of iron?",
    "who was the longest reigning monarch?",
    "what is the primary source of earth's energy?",
    "how do i make sourdough bread?",
    "what is the average depth of the ocean?",
    "who composed the four seasons?",
    "what is the smallest planet in the solar system?",
    "how do i protect my skin from the sun?",
    "what is the largest mammal on earth?",
    "who discovered radium?",
    "what is the main gas in the atmosphere?",
    "how do i set up a home aquarium?",
    "what is the speed of a bullet train?",
    "what is the origin of the olympic games?",
    "who wrote the odyssey?",
    "what is the average lifespan of a house cat?",
    "how do i improve my posture?",
    "what is the coldest place on earth?",
]


def build_positive():
    out = []
    for tool, tmpls in TEMPLATES.items():
        for _ in range(PER_TOOL):
            tmpl, builder = random.choice(tmpls)
            args = builder()
            query = tmpl.format(**args)
            tj = tools_json(tool, n_distractors=random.randint(2, 4))
            answers = json.dumps([{"name": tool, "arguments": args}], separators=(",", ":"))
            out.append({"query": query, "tools": tj, "answers": answers})
    random.shuffle(out)
    return out


def build_negative():
    # OPTIONAL. Needle is a single-shot tool-caller with a constrained decoder
    # that always emits a tool name from the provided list, so a true "no tool"
    # answer is not part of its native training distribution. We emit answers="[]"
    # as a hypothesis; the local agent should confirm needle's no-match behavior
    # (try `needle run` on an OOD query with P31 tools) and DROP negatives if
    # training rejects the empty array. See runbook caveat.
    out = []
    all_tools = json.dumps([tool_obj(t) for t in TOOLS], separators=(",", ":"))
    for q in NEGATIVE_QUERIES[:NEGATIVES]:
        out.append({"query": q, "tools": all_tools, "answers": "[]"})
    return out


def main():
    positives = build_positive()
    negatives = build_negative()

    with open("p31-train.jsonl", "w") as f:
        for e in positives:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")
    with open("p31-negative.jsonl", "w") as f:
        for e in negatives:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")
    with open("p31-train.sample.jsonl", "w") as f:
        for e in positives[:5]:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")

    print(f"p31-train.jsonl     : {len(positives)} examples ({PER_TOOL} x {len(TOOLS)} tools)")
    print(f"p31-negative.jsonl  : {len(negatives)} examples (OPTIONAL)")
    print(f"p31-train.sample.jsonl: 5 lines for inspection")


if __name__ == "__main__":
    main()
