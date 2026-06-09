import { EmbedBuilder } from "discord.js";
import type { CommandContext, P31Command } from "./base";
import { EIGHT_BALL, randomInt } from "../lib/p31-amusement-data";

type Rps = "rock" | "paper" | "scissors";

type NumberGame = { secret: number; tries: number };
const numberByChannel = new Map<string, NumberGame>();

function parseDice(spec: string): { n: number; sides: number } | null {
  const m = /^(\d{1,2})d(\d{1,3})$/i.exec(spec.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 10);
  const sides = parseInt(m[2]!, 10);
  if (n < 1 || n > 20 || sides < 2 || sides > 100) return null;
  return { n, sides };
}

export class PlayCommand implements P31Command {
  name = "play";
  description = "Mini-games: rock/paper/scissors, coin flip, dice, 8-ball";
  aliases = ["game", "games"];
  usage =
    "play rps rock|paper|scissors • play flip • play roll 2d6 • play 8ball [q] • play number [1-100]";

  async execute(context: CommandContext): Promise<void> {
    const { message, args, prefix } = context;
    const mode = args[0]?.toLowerCase();

    if (!mode) {
      await message.reply(
        [
          "**Play menu**",
          `\`${prefix}play rps rock\` · \`${prefix}play flip\` · \`${prefix}play roll 2d6\``,
          `\`${prefix}play 8ball will we ship?\` · \`${prefix}play number\` then \`${prefix}play number 52\``,
        ].join("\n"),
      );
      return;
    }

    if (mode === "number" || mode === "guess") {
      const raw = args[1];
      const cid = message.channel.id;
      if (raw === undefined) {
        const secret = 1 + randomInt(100);
        numberByChannel.set(cid, { secret, tries: 0 });
        await message.reply(
          `🔢 **1–100** — I'm thinking of an integer. You have **7** tries.\n\`${prefix}play number 50\``,
        );
        return;
      }
      const n = parseInt(raw, 10);
      if (Number.isNaN(n) || n < 1 || n > 100) {
        await message.reply("Pick an integer **1–100**.");
        return;
      }
      const g = numberByChannel.get(cid);
      if (!g) {
        await message.reply(`Start a round with \`${prefix}play number\` first.`);
        return;
      }
      g.tries += 1;
      if (n === g.secret) {
        numberByChannel.delete(cid);
        await message.reply(
          `🎯 **${n}** — nailed it in **${g.tries}** ${g.tries === 1 ? "try" : "tries"}.`,
        );
        return;
      }
      if (g.tries >= 7) {
        numberByChannel.delete(cid);
        await message.reply(
          `Out of tries — the number was **${g.secret}**. \`${prefix}play number\` for a rematch.`,
        );
        return;
      }
      const hint = n < g.secret ? "higher ⬆️" : "lower ⬇️";
      await message.reply(
        `${hint} — try **${7 - g.tries}** more.`,
      );
      return;
    }

    if (mode === "flip" || mode === "coin") {
      const heads = Math.random() < 0.5;
      await message.reply(heads ? "🪙 **Heads** — call it serendipity." : "🪙 **Tails** — still deterministic chaos.");
      return;
    }

    if (mode === "roll" || mode === "dice") {
      const spec = args[1] || "1d20";
      const parsed = parseDice(spec);
      if (!parsed) {
        await message.reply(
          `Use NdM (e.g. \`${prefix}play roll 2d6\`). Max 20 dice, sides 2–100.`,
        );
        return;
      }
      const rolls: number[] = [];
      let sum = 0;
      for (let i = 0; i < parsed.n; i++) {
        const r = 1 + randomInt(parsed.sides);
        rolls.push(r);
        sum += r;
      }
      const embed = new EmbedBuilder()
        .setTitle(`🎲 ${parsed.n}d${parsed.sides}`)
        .setColor(0x8b5cf6)
        .setDescription(
          parsed.n === 1
            ? `**${rolls[0]}**`
            : `Rolls: ${rolls.join(", ")}\n**Sum: ${sum}**`,
        );
      await message.reply({ embeds: [embed] });
      return;
    }

    if (mode === "8ball" || mode === "ball" || mode === "oracleball") {
      const q = args.slice(1).join(" ").trim();
      const ans = EIGHT_BALL[randomInt(EIGHT_BALL.length)]!;
      const embed = new EmbedBuilder()
        .setTitle("🔮 Mesh 8-ball")
        .setColor(0xec4899)
        .setDescription(q ? `*“${q.slice(0, 200)}”*\n\n${ans}` : ans);
      await message.reply({ embeds: [embed] });
      return;
    }

    if (mode === "rps") {
      const pick = args[1]?.toLowerCase() as Rps | undefined;
      if (!pick || !["rock", "paper", "scissors", "r", "p", "s"].includes(pick)) {
        await message.reply(
          `Pick \`rock\`, \`paper\`, or \`scissors\` — e.g. \`${prefix}play rps rock\``,
        );
        return;
      }
      const map: Record<string, Rps> = {
        r: "rock",
        rock: "rock",
        p: "paper",
        paper: "paper",
        s: "scissors",
        scissors: "scissors",
      };
      const you = map[pick]!;
      const bot = (["rock", "paper", "scissors"] as const)[randomInt(3)]!;
      const emoji: Record<Rps, string> = {
        rock: "🪨",
        paper: "📄",
        scissors: "✂️",
      };
      let outcome: string;
      if (you === bot) outcome = "**Draw** — great minds, same entropy.";
      else if (
        (you === "rock" && bot === "scissors") ||
        (you === "paper" && bot === "rock") ||
        (you === "scissors" && bot === "paper")
      ) {
        outcome = "**You win** — ship it.";
      } else {
        outcome = "**Bot wins** — run `verify` and try again.";
      }
      await message.reply(
        `${emoji[you]} You: **${you}**  vs  ${emoji[bot]} Bot: **${bot}**\n${outcome}`,
      );
      return;
    }

    await message.reply(`Unknown mode \`${mode}\`. Try \`${prefix}play\` for the menu.`);
  }
}
