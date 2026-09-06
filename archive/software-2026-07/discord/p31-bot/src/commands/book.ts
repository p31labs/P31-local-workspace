import { Message, EmbedBuilder } from "discord.js";
import { CommandContext, P31Command } from "./base";

export class BookCommand implements P31Command {
  name = "book";
  description = "Mother Nature and Father Time — P31 Labs children's book";
  aliases = ["mnft", "mothernatrue", "storybook"];
  usage = "book [read|pdf|about]";

  async execute(context: CommandContext): Promise<void> {
    const { message, args } = context;
    const sub = args[0]?.toLowerCase();

    switch (sub) {
      case "pdf":
        await this.sendPdf(message);
        break;
      case "about":
        await this.sendAbout(message);
        break;
      case "read":
      default:
        await this.sendAnnouncement(message);
    }
  }

  private async sendAnnouncement(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle("Mother Nature and Father Time: The Spark and the Cage")
      .setColor(0x1a1a2e)
      .setDescription(
        "A children's book for neurodivergent families — and for every wild spark that needed a steady cage.\n\n" +
        "*For Bash and Willow — who are both.*"
      )
      .addFields(
        {
          name: "Read Online (Free)",
          value: "https://mother-nature-book.pages.dev",
          inline: false,
        },
        {
          name: "Digital PDF ($1 + donation)",
          value: "https://ko-fi.com/trimtab69420",
          inline: false,
        },
        {
          name: "What's inside",
          value:
            "17 illustrated pages. AuDHD told as myth — chaos and structure learning to speak each other's language. " +
            "Posner molecules. Trim tabs. Slow blinks. Wonky sprouts.\n\n" +
            "Written by a Dad who needed it to exist.",
          inline: false,
        }
      )
      .setFooter({ text: "P31 Labs • p31 book pdf for download link • p31 book about for context" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  private async sendPdf(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle("Get the PDF — Mother Nature and Father Time")
      .setColor(0xf59e0b)
      .setDescription("Digital download available on Ko-fi.")
      .addFields(
        { name: "Ko-fi (PDF + support P31 Labs)", value: "https://ko-fi.com/trimtab69420", inline: false },
        { name: "Price", value: "$1 minimum + optional donation", inline: true },
        { name: "Format", value: "PDF, 17 pages, 8.8MB", inline: true },
      )
      .setFooter({ text: "All proceeds support P31 Labs nonprofit mission" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  private async sendAbout(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle("About the Book")
      .setColor(0x1a1a2e)
      .setDescription(
        "**Mother Nature and Father Time: The Spark and the Cage**\n" +
        "A children's picture book for AuDHD families.\n\n" +
        "Chaos is not a flaw — it is the raw energy of creation. " +
        "Father Time's cages are not prisons but Posner molecules: protective geometry that lets the wild light shine safely. " +
        "Meltdowns are Genre Errors — emotion and structure speaking different dialects of love.\n\n" +
        "The Trim Tab and the Slow Blink are the smallest adjustments that turn the largest ships.\n\n" +
        "*You need both the spark and the cage to grow a forest.*"
      )
      .addFields(
        { name: "Dedicated to", value: "Bash and Willow", inline: true },
        { name: "Illustrations", value: "16 AI-generated pages", inline: true },
        { name: "Published", value: "April 2026, P31 Labs", inline: true },
        { name: "Web Edition", value: "https://mother-nature-book.pages.dev", inline: false },
      )
      .setFooter({ text: "P31 Labs • phosphorus31.org" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
}
