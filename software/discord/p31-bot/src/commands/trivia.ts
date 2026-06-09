import { EmbedBuilder } from "discord.js";
import type { CommandContext, P31Command } from "./base";
import { TRIVIA_DECK, type TriviaTag, randomInt } from "../lib/p31-amusement-data";
import { seededIndex, utcYmd } from "../lib/amusement-seed";

const LABELS = ["A", "B", "C", "D"] as const;
const TAGS = new Set<string>(["mesh", "stack", "science", "lore"]);

type TriviaStats = { correct: number; wrong: number; streak: number; best: number };

function statsKey(guildId: string | undefined, userId: string): string {
  return `${guildId ?? "dm"}:${userId}`;
}

export class TriviaCommand implements P31Command {
  name = "trivia";
  description = "P31-flavored trivia — tags, streaks, channel sessions";
  aliases = ["quiz"];
  usage =
    "trivia • trivia daily (UTC) • [mesh|stack|science|lore] • trivia a|b|c|d • answer • stats";

  /** channelId -> last card index in TRIVIA_DECK */
  private static lastByChannel = new Map<string, number>();
  private static stats = new Map<string, TriviaStats>();

  private static bumpStats(key: string, won: boolean): TriviaStats {
    const cur = TriviaCommand.stats.get(key) ?? {
      correct: 0,
      wrong: 0,
      streak: 0,
      best: 0,
    };
    if (won) {
      cur.correct += 1;
      cur.streak += 1;
      cur.best = Math.max(cur.best, cur.streak);
    } else {
      cur.wrong += 1;
      cur.streak = 0;
    }
    TriviaCommand.stats.set(key, cur);
    return cur;
  }

  async execute(context: CommandContext): Promise<void> {
    const { message, args, prefix } = context;
    const sub = args[0]?.toLowerCase();
    const cid = message.channel.id;
    const sk = statsKey(message.guild?.id, message.author.id);

    if (sub === "stats") {
      const s = TriviaCommand.stats.get(sk) ?? {
        correct: 0,
        wrong: 0,
        streak: 0,
        best: 0,
      };
      const played = s.correct + s.wrong;
      const embed = new EmbedBuilder()
        .setTitle("📊 Trivia stats (session memory)")
        .setColor(0x6366f1)
        .setDescription(
          [
            `**${message.author.username}**`,
            played
              ? `Correct **${s.correct}** · Wrong **${s.wrong}** · Win rate **${Math.round((100 * s.correct) / played)}%**`
              : "No answers yet — grab a card.",
            `Streak **${s.streak}** · Best **${s.best}**`,
            "",
            "_Resets if the bot restarts — this is a toy ledger, not a bank._",
          ].join("\n"),
        );
      await message.reply({ embeds: [embed] });
      return;
    }

    if (sub === "daily") {
      const y = utcYmd();
      const idx = seededIndex(TRIVIA_DECK.length, `trivia-daily:${y}`);
      TriviaCommand.lastByChannel.set(cid, idx);
      const card = TRIVIA_DECK[idx]!;
      const lines = card.choices.map((c, i) => `**${LABELS[i]}** — ${c}`).join("\n");
      const embed = new EmbedBuilder()
        .setTitle(`🧠 Trivia — daily (${y} UTC)`)
        .setColor(0x14b8a6)
        .setDescription(`${card.q}\n\n${lines}`)
        .addFields({
          name: "Lock in",
          value: `\`${prefix}trivia a\` … \`${prefix}trivia d\` — same card worldwide today.`,
        })
        .setFooter({
          text: `Deck ${idx + 1}/${TRIVIA_DECK.length} · tag ${card.tag} · \`${prefix}trivia stats\``,
        });
      await message.reply({ embeds: [embed] });
      return;
    }

    if (sub === "answer" || sub === "reveal") {
      const idx = TriviaCommand.lastByChannel.get(cid);
      if (idx === undefined) {
        await message.reply(`No active card — run \`${prefix}trivia\` first.`);
        return;
      }
      const card = TRIVIA_DECK[idx]!;
      const letter = LABELS[card.correct];
      const embed = new EmbedBuilder()
        .setTitle("📖 Answer")
        .setColor(0x9c27b0)
        .setDescription(
          `Correct: **${letter}** — ${card.choices[card.correct]}\n\n_${card.explain}_`,
        );
      await message.reply({ embeds: [embed] });
      return;
    }

    if (/^[abcd]$/.test(sub ?? "")) {
      const idx = TriviaCommand.lastByChannel.get(cid);
      if (idx === undefined) {
        await message.reply(`No active card — run \`${prefix}trivia\` first.`);
        return;
      }
      const card = TRIVIA_DECK[idx]!;
      const guess = sub!.charCodeAt(0) - "a".charCodeAt(0);
      const ok = guess === card.correct;
      const after = TriviaCommand.bumpStats(sk, ok);
      const embed = new EmbedBuilder()
        .setTitle(ok ? "✅ Nice" : "📚 Learning moment")
        .setColor(ok ? 0x22c55e : 0xf97316)
        .setDescription(
          ok
            ? `**${LABELS[card.correct]}** — ${card.choices[card.correct]}\n\n_${card.explain}_`
            : `Not quite — correct was **${LABELS[card.correct]}**: ${card.choices[card.correct]}\n\n_${card.explain}_`,
        )
        .setFooter({
          text: `Streak ${after.streak} · best ${after.best} · tag ${card.tag}`,
        });
      if (ok && after.streak >= 5 && after.streak % 5 === 0) {
        embed.addFields({
          name: "🔥 Streak milestone",
          value: `${after.streak} correct in a row — hydrate anyway.`,
        });
      }
      await message.reply({ embeds: [embed] });
      return;
    }

    let triggerNew = false;
    let tagOnly: TriviaTag | undefined;

    if (!sub || sub === "new" || sub === "again") {
      triggerNew = true;
      const maybe = args[1]?.toLowerCase();
      if (maybe && TAGS.has(maybe)) {
        tagOnly = maybe as TriviaTag;
      }
    } else if (sub && TAGS.has(sub)) {
      triggerNew = true;
      tagOnly = sub as TriviaTag;
    }

    if (triggerNew) {
      let deck = TRIVIA_DECK;
      if (tagOnly) {
        deck = TRIVIA_DECK.filter((c) => c.tag === tagOnly);
        if (!deck.length) deck = TRIVIA_DECK;
      }
      const card = deck[randomInt(deck.length)]!;
      const globalIdx = TRIVIA_DECK.indexOf(card);
      TriviaCommand.lastByChannel.set(cid, globalIdx);
      const lines = card.choices.map((c, i) => `**${LABELS[i]}** — ${c}`).join("\n");
      const embed = new EmbedBuilder()
        .setTitle(`🧠 Trivia${tagOnly ? ` · ${tagOnly}` : ""}`)
        .setColor(0x06b6d4)
        .setDescription(`${card.q}\n\n${lines}`)
        .addFields({
          name: "Lock in",
          value: `\`${prefix}trivia a\` … \`${prefix}trivia d\` — peek: \`${prefix}trivia answer\``,
        })
        .setFooter({
          text: `Deck ${globalIdx + 1}/${TRIVIA_DECK.length} · tag ${card.tag} · \`${prefix}trivia stats\``,
        });
      await message.reply({ embeds: [embed] });
      return;
    }

    await message.reply(
      `Try \`${prefix}trivia\`, \`${prefix}trivia daily\`, a tag (\`${prefix}trivia mesh\`), or \`${prefix}trivia stats\`.`,
    );
  }
}
