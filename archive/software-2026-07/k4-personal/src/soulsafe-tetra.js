/**
 * p31.soulsafeTetra/0.1.0 — four specialist "effects" (SIC-POVM-style lenses) + fusion.
 * All calls use the same Workers AI binding; specialists are prompt-isolated only (v0.1).
 */

export const SOULSAFE_TETRA_SCHEMA = "p31.soulsafeTetra/0.1.0";

export const SOULSAFE_EFFECT_ORDER = ["structure", "connection", "rhythm", "creation"];

export const DEFAULT_SOULSAFE_MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fast";

/**
 * @param {string} effectKey
 * @param {Record<string, unknown>} profile
 * @param {{ spoons: number, max: number }} energy
 * @param {string} [scope]
 * @param {Array<{ name?: string }>} [tools]
 */
export function buildSpecialistSystemPrompt(effectKey, profile, energy, scope, tools) {
  const name = typeof profile?.name === "string" ? profile.name : "this user";
  const role = typeof profile?.role === "string" ? profile.role : "mesh participant";
  const toolNames = (tools || []).map((t) => t.name).filter(Boolean).join(", ") || "none";
  const base = [
    `You are specialist lens "${effectKey}" in a SOULSAFE cognitive system for ${name}.`,
    `User role: ${role}. Energy: ${energy.spoons}/${energy.max} spoons.`,
    `Scope: ${scope || "personal"}. Tools (names only): ${toolNames}.`,
    `Output: 2–4 short sentences. No preamble, no "As a specialist". English.`,
  ].join(" ");
  const lens =
    {
      structure:
        "Focus: concrete steps, constraints, prerequisites, ordering — what must be true first.",
      connection:
        "Focus: people affected, communication, dependencies, mesh/family context.",
      rhythm:
        "Focus: pacing, spoons/energy, when to stop, recovery — SOULSAFE rhythm.",
      creation:
        "Focus: alternatives, creative angles, safe experiments, build ideas.",
    }[effectKey] || "Focus: helpful nuance for this quadrant.";
  return `${base} ${lens}`;
}

/**
 * @param {Record<string, unknown>} profile
 * @param {{ spoons: number, max: number }} energy
 * @param {string} [scope]
 */
export function buildFusionSystemPrompt(profile, energy, scope) {
  const name = typeof profile?.name === "string" ? profile.name : "the user";
  return [
    `You merge four specialist notes into one answer for ${name}.`,
    `Scope: ${scope || "personal"}. Energy: ${energy.spoons}/${energy.max} spoons.`,
    `Rules: one coherent voice; no mention of specialists or lenses; be concise.`,
    `If energy is low (under 6 spoons), prefer shorter answers and suggest rest when appropriate.`,
    `SOULSAFE: no medical directives beyond general encouragement to follow their care team; calcium emergencies are already handled elsewhere in the system.`,
  ].join(" ");
}

/**
 * @param {any} ai Workers AI binding
 * @param {string} modelId
 * @param {Array<{ role: string, content: string }>} messages
 * @param {number} maxTokens
 */
async function runAi(ai, modelId, messages, maxTokens) {
  const out = await ai.run(modelId, {
    messages,
    temperature: 0.2,
    max_tokens: maxTokens,
  });
  const text = out?.response;
  return typeof text === "string" ? text.trim() : "";
}

/**
 * @param {object} opts
 * @param {any} opts.ai Workers AI binding
 * @param {string} [opts.modelId]
 * @param {Record<string, unknown>} opts.profile
 * @param {{ spoons: number, max: number }} opts.energy
 * @param {string} opts.scrubbedUserMessage
 * @param {Array<{ role: string, content: string }>} opts.scrubbedHistoryTail
 * @param {string} [opts.scope]
 * @param {Array<{ name?: string }>} [opts.tools]
 */
export async function runSoulsafeTetra(opts) {
  const modelId = opts.modelId || DEFAULT_SOULSAFE_MODEL_ID;
  const { ai, profile, energy, scrubbedUserMessage, scrubbedHistoryTail, scope, tools } = opts;

  const historyForSpecialists = scrubbedHistoryTail.slice(-8);

  const effectPromises = SOULSAFE_EFFECT_ORDER.map(async (key) => {
    const sys = buildSpecialistSystemPrompt(key, profile, energy, scope, tools);
    try {
      const text = await runAi(
        ai,
        modelId,
        [
          { role: "system", content: sys },
          ...historyForSpecialists,
          { role: "user", content: scrubbedUserMessage },
        ],
        192
      );
      return { key, text: text || "(no output)" };
    } catch (e) {
      return { key, text: `(${key}: inference error)` };
    }
  });

  const effectRows = await Promise.all(effectPromises);
  /** @type {Record<string, string>} */
  const effects = {};
  for (const row of effectRows) {
    effects[row.key] = row.text;
  }

  const specialistBlock = SOULSAFE_EFFECT_ORDER.map((k) => `## ${k}\n${effects[k]}`).join("\n\n");

  const fusionMessages = [
    { role: "system", content: buildFusionSystemPrompt(profile, energy, scope) },
    ...scrubbedHistoryTail.slice(-6),
    {
      role: "user",
      content: `User message:\n${scrubbedUserMessage}\n\nSpecialist notes:\n${specialistBlock}\n\nMerged answer:`,
    },
  ];

  let reply = await runAi(ai, modelId, fusionMessages, 512);
  if (!reply) reply = Object.values(effects).join("\n\n");

  return {
    schema: SOULSAFE_TETRA_SCHEMA,
    effects,
    reply,
    modelId,
  };
}
