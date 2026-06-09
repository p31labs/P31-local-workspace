import { EmbedBuilder } from "discord.js";
import type { CommandContext, P31Command } from "./base";
import { seededIndex } from "../lib/amusement-seed";
import {
  EDGE_VOICES,
  SEAL_CLOSURES,
  TETRA_SPARKS,
  VERTEX_LABELS,
} from "../lib/tetra-seal-data";
import { randomInt } from "../lib/p31-amusement-data";

/** Six edges of K₄ in stable order. */
const EDGES: readonly (readonly [number, number])[] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
];

type TetraState = [string | null, string | null, string | null, string | null];

const byChannel = new Map<string, TetraState>();

const MAX_WORD_LEN = 40;

function freshState(): TetraState {
  return [null, null, null, null];
}

function normalizeWord(raw: string): string | null {
  const t = raw.trim().replace(/\s+/g, " ");
  if (!t) return null;
  if (t.length > MAX_WORD_LEN) return null;
  return t;
}

function formatProgress(state: TetraState, prefix: string): string {
  const lines = VERTEX_LABELS.map((label, i) => {
    const v = state[i];
    return v ? `**${i + 1} · ${label}** — ${v}` : `**${i + 1} · ${label}** — _empty_`;
  });
  return [
    "🔺 **Tetra seal** — four words on a complete graph (six edges).",
    ...lines,
    "",
    `Set a slot: \`${prefix}tetra 1 your word\` … \`4\``,
    `Roll a spark: \`${prefix}tetra roll\` · Clear: \`${prefix}tetra start\` · Finish: \`${prefix}tetra seal\``,
  ].join("\n");
}

function buildSealEmbed(state: TetraState, prefix: string): EmbedBuilder {
  const words = state.map((w) => w!);
  const edgeLines: string[] = [];
  EDGES.forEach(([a, b], ei) => {
    const wa = words[a]!;
    const wb = words[b]!;
    const vi = seededIndex(
      EDGE_VOICES.length,
      `tetra:${ei}:${wa.toLowerCase()}:${wb.toLowerCase()}`,
    );
    const voice = EDGE_VOICES[vi]!;
    edgeLines.push(
      `**${a + 1}–${b + 1}** (${VERTEX_LABELS[a]} ↔ ${VERTEX_LABELS[b]}): _${wa}_ · _${wb}_\n${voice}`,
    );
  });
  const sealIdx = seededIndex(
    SEAL_CLOSURES.length,
    `tetra-seal:${words.join("|").toLowerCase()}`,
  );
  const closure = SEAL_CLOSURES[sealIdx]!;
  const block = edgeLines.join("\n\n");
  const embed = new EmbedBuilder()
    .setTitle("🔺 Tetra sealed (K₄)")
    .setColor(0x7c3aed)
    .setDescription(
      VERTEX_LABELS.map((label, i) => `**${i + 1} · ${label}** — ${words[i]}`).join("\n"),
    )
    .addFields({
      name: "Seal",
      value: closure.slice(0, 1024),
    });
  if (block.length <= 1024) {
    embed.spliceFields(0, 0, { name: "Six edge readings", value: block });
  } else {
    embed.spliceFields(0, 0, {
      name: "Edge readings (1/2)",
      value: edgeLines.slice(0, 3).join("\n\n").slice(0, 1024),
    });
    embed.spliceFields(1, 0, {
      name: "Edge readings (2/2)",
      value: edgeLines.slice(3).join("\n\n").slice(0, 1024),
    });
  }
  return embed.setFooter({
    text: `Original mesh ritual · ${prefix}tetra start for a fresh tetra`,
  });
}

export class TetraCommand implements P31Command {
  name = "tetra";
  description = "Tetra seal — place four words on K₄; get six edge readings + a closure";
  aliases = ["tetragram", "k4seal", "seal4"];
  usage = "tetra • tetra 1–4 <word> • tetra roll • tetra seal • tetra start";

  async execute(context: CommandContext): Promise<void> {
    const { message, args, prefix } = context;
    const cid = message.channel.id;
    const sub = args[0]?.toLowerCase();

    if (sub === "help" || sub === "menu") {
      await message.reply(formatProgress(byChannel.get(cid) ?? freshState(), prefix));
      return;
    }

    if (sub === "start" || sub === "clear" || sub === "reset") {
      byChannel.set(cid, freshState());
      await message.reply(
        [
          "Cleared. Four empty vertices.",
          formatProgress(freshState(), prefix),
        ].join("\n\n"),
      );
      return;
    }

    if (sub === "roll") {
      let state = byChannel.get(cid);
      if (!state) {
        state = freshState();
        byChannel.set(cid, state);
      }
      const emptyIdx = state.findIndex((x) => x === null);
      if (emptyIdx === -1) {
        await message.reply(
          `All four vertices are full — \`${prefix}tetra seal\` or \`${prefix}tetra start\`.`,
        );
        return;
      }
      const spark = TETRA_SPARKS[randomInt(TETRA_SPARKS.length)]!;
      state[emptyIdx] = spark;
      await message.reply(
        [
          `🎲 Rolled **${spark}** into **${emptyIdx + 1} · ${VERTEX_LABELS[emptyIdx]}**.`,
          "",
          formatProgress(state, prefix),
        ].join("\n"),
      );
      return;
    }

    if (sub === "seal") {
      const state = byChannel.get(cid) ?? freshState();
      if (state.some((x) => x === null)) {
        await message.reply(
          `Not full yet — finish all four vertices.\n\n${formatProgress(state, prefix)}`,
        );
        return;
      }
      const embed = buildSealEmbed(state, prefix);
      byChannel.set(cid, freshState());
      await message.reply({ embeds: [embed] });
      return;
    }

    if (/^[1-4]$/.test(sub ?? "")) {
      const idx = parseInt(sub!, 10) - 1;
      const rest = args.slice(1).join(" ").trim();
      const word = normalizeWord(rest);
      if (!word) {
        await message.reply(
          `Give a word or short phrase (max **${MAX_WORD_LEN}** chars): \`${prefix}tetra ${idx + 1} quantum kindness\`.`,
        );
        return;
      }
      let state = byChannel.get(cid);
      if (!state) {
        state = freshState();
        byChannel.set(cid, state);
      }
      state[idx] = word;

      if (state.every((x) => x !== null)) {
        const embed = buildSealEmbed(state, prefix);
        byChannel.set(cid, freshState());
        await message.reply({
          content: "All four vertices set — **auto-sealed.**",
          embeds: [embed],
        });
        return;
      }

      await message.reply(
        [`Set **${idx + 1} · ${VERTEX_LABELS[idx]}** → _${word}_`, "", formatProgress(state, prefix)].join(
          "\n",
        ),
      );
      return;
    }

    const state = byChannel.get(cid) ?? freshState();
    await message.reply(formatProgress(state, prefix));
  }
}
