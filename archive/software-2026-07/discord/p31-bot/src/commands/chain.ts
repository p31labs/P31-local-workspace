import { EmbedBuilder } from "discord.js";
import type { CommandContext, P31Command } from "./base";
import { CHAIN_STARTERS, randomInt } from "../lib/p31-amusement-data";

const MAX_WORDS_TOTAL = 52;
const MAX_WORDS_PER_ADD = 22;

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export class ChainCommand implements P31Command {
  name = "chain";
  description = "Collaborative one-line-at-a-time story — exquisite mesh";
  aliases = ["story", "exquisite"];
  usage = "chain start • chain add …words • chain view • chain undo • chain end";

  private static byChannel = new Map<string, string[]>();

  async execute(context: CommandContext): Promise<void> {
    const { message, args, prefix } = context;
    const cid = message.channel.id;
    const sub = args[0]?.toLowerCase();

    if (!sub || sub === "help" || sub === "menu") {
      await message.reply(
        [
          "📎 **Chain story** — add text in turns; bot stitches with spaces.",
          `\`${prefix}chain start\` — random starter`,
          `\`${prefix}chain add then the graph laughed\` — append (max ${MAX_WORDS_PER_ADD} words per add)`,
          `\`${prefix}chain view\` · \`${prefix}chain undo\` · \`${prefix}chain end\` (print + clear)`,
          `Hard cap ~${MAX_WORDS_TOTAL} words total — keeps Discord calm.`,
        ].join("\n"),
      );
      return;
    }

    if (sub === "start" || sub === "new") {
      const starter = CHAIN_STARTERS[randomInt(CHAIN_STARTERS.length)]!;
      ChainCommand.byChannel.set(cid, [starter]);
      await message.reply(
        `**Starter:** ${starter}\n\n— \`${prefix}chain add your next fragment\``,
      );
      return;
    }

    if (sub === "view" || sub === "show") {
      const parts = ChainCommand.byChannel.get(cid);
      if (!parts?.length) {
        await message.reply(`No chain here — \`${prefix}chain start\`.`);
        return;
      }
      const body = parts.join(" ");
      const embed = new EmbedBuilder()
        .setTitle("📎 Chain so far")
        .setColor(0xa855f7)
        .setDescription(body.length > 3900 ? `${body.slice(0, 3897)}…` : body)
        .setFooter({ text: `${wordCount(body)} words · ${parts.length} fragments` });
      await message.reply({ embeds: [embed] });
      return;
    }

    if (sub === "end" || sub === "finish") {
      const parts = ChainCommand.byChannel.get(cid);
      if (!parts?.length) {
        await message.reply("Nothing to end — start a chain first.");
        return;
      }
      const body = parts.join(" ");
      ChainCommand.byChannel.delete(cid);
      const embed = new EmbedBuilder()
        .setTitle("📎 Chain — fin")
        .setColor(0x22c55e)
        .setDescription(body.length > 3900 ? `${body.slice(0, 3897)}…` : body)
        .setFooter({ text: `${wordCount(body)} words · saved only in scrollback` });
      await message.reply({ embeds: [embed] });
      return;
    }

    if (sub === "undo") {
      const parts = ChainCommand.byChannel.get(cid);
      if (!parts || parts.length <= 1) {
        await message.reply("Nothing to undo (or only the starter remains).");
        return;
      }
      parts.pop();
      await message.reply(`Removed last fragment — **${parts.length}** blocks left. \`${prefix}chain view\``);
      return;
    }

    if (sub === "add" || sub === "+") {
      const chunk = args.slice(1).join(" ").trim();
      if (!chunk) {
        await message.reply(`Say what to add: \`${prefix}chain add your words here\`.`);
        return;
      }
      const addN = wordCount(chunk);
      if (addN > MAX_WORDS_PER_ADD) {
        await message.reply(`That add is **${addN}** words — max **${MAX_WORDS_PER_ADD}** per turn.`);
        return;
      }
      let parts = ChainCommand.byChannel.get(cid);
      if (!parts) {
        const starter = CHAIN_STARTERS[randomInt(CHAIN_STARTERS.length)]!;
        parts = [starter];
        ChainCommand.byChannel.set(cid, parts);
      }
      const curTotal = wordCount(parts.join(" "));
      if (curTotal + addN > MAX_WORDS_TOTAL) {
        await message.reply(
          `That would exceed **${MAX_WORDS_TOTAL}** words — \`${prefix}chain end\` or \`undo\`.`,
        );
        return;
      }
      parts.push(chunk);
      await message.reply(
        `Added (**${curTotal + addN}** / ~${MAX_WORDS_TOTAL} words). \`${prefix}chain view\``,
      );
      return;
    }

    await message.reply(`Try \`${prefix}chain\` for the menu.`);
  }
}
