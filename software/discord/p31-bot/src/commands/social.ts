import { Message, EmbedBuilder } from "discord.js";
import { CommandContext, P31Command, getApiUrls } from "./base";
import { defaultRetryableFetch } from "../services/retryUtility";

interface SCETemplate {
  name: string;
  pillar: string;
  description: string;
  variables: string[];
}

interface SCEPost {
  id: number;
  title: string;
  template: string;
  body: string;
  platforms: string[];
  status: string;
  scheduled_at: string | null;
  spoon_cost: number;
}

interface SCEDashboard {
  total_posts: number;
  by_status: Record<string, number>;
  by_pillar: Record<string, number>;
  published_today: number;
}

export class SocialCommand implements P31Command {
  name = "social";
  description = "P31 Social Content Engine — templates, scheduling, analytics";
  aliases = ["sce", "content", "post"];
  usage = "social [templates|dashboard|create|schedule]";

  private sceUrl = process.env.SCE_API_URL || "https://p31labs.github.io/social-content-engine";

  async execute(context: CommandContext): Promise<void> {
    const { message, args } = context;
    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case "templates":
      case "template":
        await this.showTemplates(message, args[1]);
        break;
      case "dashboard":
      case "stats":
        await this.showDashboard(message);
        break;
      case "create":
      case "new":
        await this.showCreateHelp(message);
        break;
      case "schedule":
        await this.showScheduleHelp(message);
        break;
      default:
        await this.showHelp(message);
    }
  }

  private async showTemplates(message: Message, filter?: string): Promise<void> {
    const pillarFilters: Record<string, string> = {
      creation: "🔧 Creation",
      education: "📚 Education",
      advocacy: "⚖️ Advocacy",
      awareness: "🎯 Awareness"
    };

    const templates: Record<string, SCETemplate> = {
      creation_hardware_drop: { name: "Hardware Drop", pillar: "creation", description: "Showcase a new hardware build", variables: ["hardware_name", "features", "tech_stack", "status"] },
      creation_code_drop: { name: "Code Drop", pillar: "creation", description: "Share new code or software", variables: ["project_name", "feature", "language", "repo_link"] },
      creation_prototype: { name: "Prototype Preview", pillar: "creation", description: "Teaser for upcoming project", variables: ["project_name", "teaser", "launch_date"] },
      education_concept: { name: "Concept Explainer", pillar: "education", description: "Explain technical concept", variables: ["concept", "simple_explanation", "real_world_example", "deep_dive_link"] },
      education_tutorial: { name: "Tutorial", pillar: "education", description: "Step-by-step guide", variables: ["tutorial_title", "steps_summary", "difficulty", "time_estimate"] },
      education_math: { name: "Math/Physics", pillar: "education", description: "Mathematical concepts", variables: ["topic", "formula", "intuition", "application"] },
      advocacy_ada: { name: "ADA Rights", pillar: "advocacy", description: "Disability rights advocacy", variables: ["issue", "impact", "call_to_action", "resource_link"] },
      advocacy_legal_update: { name: "Legal Update", pillar: "advocacy", description: "Legal proceeding updates", variables: ["update_summary", "next_steps", "lessons_learned"] },
      advocacy_systemic_issue: { name: "Systemic Issue", pillar: "advocacy", description: "Highlight systemic problems", variables: ["problem", "root_cause", "proposed_solution"] },
      awareness_mission: { name: "Mission Declaration", pillar: "awareness", description: "Share P31 mission", variables: ["mission_statement", "core_values", "community_impact"] },
      awareness_festival: { name: "Festival/Family", pillar: "awareness", description: "Festival content", variables: ["event_name", "experience", "community_vibe"] },
      awareness_update: { name: "Status Update", pillar: "awareness", description: "Project status", variables: ["update_title", "highlights", "next_milestone"] }
    };

    let filtered = Object.entries(templates).map(([key, t]) => ({ key, ...t }));
    
    if (filter && pillarFilters[filter]) {
      filtered = filtered.filter(t => t.pillar === filter);
    }

    const byPillar = filtered.reduce((acc, t) => {
      acc[t.pillar] = (acc[t.pillar] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const embed = new EmbedBuilder()
      .setTitle("📝 P31 Social Content Engine — Templates")
      .setColor(0x6366f1)
      .setDescription(filter ? `Showing: ${pillarFilters[filter] || filter}` : "All 12 templates available")
      .setTimestamp();

    for (const [pillar, count] of Object.entries(byPillar)) {
      const pillarEmoji = pillarFilters[pillar]?.split(" ")[0] || "📋";
      embed.addFields({
        name: `${pillarEmoji} ${pillarFilters[pillar] || pillar} (${count})`,
        value: filtered.filter(t => t.pillar === pillar).map(t => `• ${t.name}`).join("\n"),
        inline: true
      });
    }

    embed.addFields({
      name: "📋 Usage",
      value: "Run `p31 social create <template>` to start creating content",
      inline: false
    });

    embed.setFooter({ text: "P31 Labs • Social Content Engine" });
    await message.reply({ embeds: [embed] });
  }

  private async showDashboard(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle("📊 P31 Social Content Engine — Dashboard")
      .setColor(0x6366f1)
      .setDescription("Content analytics and scheduling overview")
      .setTimestamp();

    embed.addFields(
      { name: "📝 Total Posts", value: "24 (mock)", inline: true },
      { name: "✅ Published", value: "18", inline: true },
      { name: "📝 Draft", value: "4", inline: true },
      { name: "⏰ Scheduled", value: "2", inline: true },
      { name: "🎯 Published Today", value: "3", inline: true }
    );

    embed.addFields({
      name: "🏛️ By Pillar",
      value: "🔧 Creation: 6\n📚 Education: 5\n⚖️ Advocacy: 4\n🎯 Awareness: 5",
      inline: true
    });

    embed.addFields({
      name: "🔗 Platform Coverage",
      value: "Mastodon: 15\nBluesky: 12\nTwitter: 8\nDiscord: 18",
      inline: true
    });

    embed.setFooter({ text: "P31 Labs • Connect SCE API for live data" });
    await message.reply({ embeds: [embed] });
  }

  private async showCreateHelp(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle("✍️ Create New Content")
      .setColor(0x6366f1)
      .setDescription("To create new content, use the SCE CLI:")
      .addFields(
        { name: "1. List templates", value: "```\npnpm sce templates\n```", inline: false },
        { name: "2. Create post", value: "```\npnpm sce create <template>\n```", inline: false },
        { name: "3. Schedule/Publish", value: "```\npnpm sce schedule <post-id> <platforms>\npnpm sce publish <post-id>\n```", inline: false },
        { name: "🔗 Integration", value: "Content can cross-post to BONDING relay for in-game announcements", inline: false }
      )
      .setFooter({ text: "P31 Labs • Social Content Engine" });
    
    await message.reply({ embeds: [embed] });
  }

  private async showScheduleHelp(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle("⏰ Schedule Content")
      .setColor(0x6366f1)
      .setDescription("The SCE uses spoon-cost scheduling to optimize posting times based on your cognitive energy levels.")
      .addFields(
        { name: "⚡ Spoon-Cost Tiers", value: "Low (2 spoons): Education, Awareness\nMedium (3 spoons): Creation\nHigh (4 spoons): Advocacy, Threads", inline: false },
        { name: "🎯 Best Times", value: "Low: Anytime\nMedium: Morning (10am-2pm)\nHigh: After cognitive break", inline: false }
      )
      .setFooter({ text: "P31 Labs • Adaptive scheduling" });
    
    await message.reply({ embeds: [embed] });
  }

  private async showHelp(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle("📝 P31 Social Content Engine")
      .setColor(0x6366f1)
      .setDescription("Content creation and distribution for the P31 ecosystem")
      .addFields(
        { name: "📋 p31 social templates", value: "List all content templates", inline: true },
        { name: "📋 p31 social templates creation", value: "Filter by pillar", inline: true },
        { name: "📊 p31 social dashboard", value: "Show analytics", inline: true },
        { name: "✍️ p31 social create", value: "Show create help", inline: true },
        { name: "⏰ p31 social schedule", value: "Show scheduling guide", inline: true }
      )
      .setFooter({ text: "P31 Labs • Built at p31labs/social-content-engine" });
    
    await message.reply({ embeds: [embed] });
  }
}
