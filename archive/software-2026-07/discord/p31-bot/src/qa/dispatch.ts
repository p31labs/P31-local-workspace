import type { Message } from "discord.js";
import {
  parseArgs,
  getApiUrls,
  getTimeout,
  type CommandRegistry,
  type CommandContext,
} from "../commands/base";

export type CapturedReply = { content?: string; embeds?: unknown[] };

/** Minimal Discord message for offline command execution. */
export function createSimulationMessage(
  content: string,
  opts: { channelId?: string; guildId?: string; userId?: string } = {},
): { message: Message; replies: CapturedReply[] } {
  const replies: CapturedReply[] = [];
  const message = {
    content,
    channel: { id: opts.channelId ?? "sim-channel" },
    guildId: opts.guildId ?? "sim-guild",
    author: {
      id: opts.userId ?? "sim-user",
      username: "sim-operator",
    },
    reply: async (payload: string | { content?: string; embeds?: unknown[] }) => {
      if (typeof payload === "string") replies.push({ content: payload });
      else replies.push({ content: payload.content, embeds: payload.embeds });
      return message;
    },
  } as unknown as Message;
  return { message, replies };
}

/** Run one prefixed line (e.g. `p31 help`) through the registry; returns captured replies. */
export async function dispatchPrefixCommand(
  registry: CommandRegistry,
  prefix: string,
  line: string,
  simOpts?: { channelId?: string; guildId?: string; userId?: string },
): Promise<CapturedReply[]> {
  const trimmed = line.trim();
  const full = trimmed.startsWith(prefix) ? trimmed : `${prefix} ${trimmed}`;
  const { message, replies } = createSimulationMessage(full, simOpts);
  const args = parseArgs(message.content, prefix);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return replies;
  const command = registry.get(commandName);
  if (!command) {
    await message.reply(`Unknown command: ${commandName}`);
    return replies;
  }
  const context: CommandContext = {
    message,
    args,
    prefix,
    apiUrls: getApiUrls(),
    timeout: getTimeout(),
  };
  await command.execute(context);
  return replies;
}
