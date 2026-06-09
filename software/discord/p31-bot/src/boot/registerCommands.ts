import { type CommandRegistry, createCommandRegistry } from "../commands/base";
import { HelpCommand } from "../commands/help";
import { SpoonCommand } from "../commands/spoon";
import { BondingCommand } from "../commands/bonding";
import { StatusCommand } from "../commands/status";
import { DeployCommand } from "../commands/deploy";
import { EggsCommand } from "../commands/eggs";
import { NodesCommand } from "../commands/nodes";
import { ClaimCommand } from "../commands/claim";
import { CortexCommand } from "../commands/cortex";
import { HealthCommand } from "../commands/health";
import { SocialCommand } from "../commands/social";
import { LeaderboardCommand } from "../commands/leaderboard";
import { EasterCommand } from "../commands/easter";
import { HousingCommand } from "../commands/housing";
import { TelemetryCommand } from "../commands/telemetry";
import { EsgCommand } from "../commands/esg";
import { RehousedCommand } from "../commands/rehoused";
import { GrantsCommand } from "../commands/grants";
import { BookCommand } from "../commands/book";
import { CrewCommand } from "../commands/crew";
import { JokeCommand } from "../commands/joke";
import { TriviaCommand } from "../commands/trivia";
import { PlayCommand } from "../commands/play";
import { DeepCommand } from "../commands/deep";
import { MeshwordCommand } from "../commands/meshword";
import { ChainCommand } from "../commands/chain";
import { ParadoxCommand } from "../commands/paradox";
import { HangmanCommand } from "../commands/hangman";
import { DriftCommand } from "../commands/drift";
import { LoreCommand } from "../commands/lore";
import { TetraCommand } from "../commands/tetra";
import { QClockCommand } from "../commands/qclock";

/** Single source of truth for command registration (runtime + QA simulation). */
export function registerAllCommands(registry: CommandRegistry): void {
  registry.register(new SpoonCommand());
  registry.register(new BondingCommand());
  registry.register(new StatusCommand());
  registry.register(new DeployCommand());
  registry.register(new EggsCommand());
  registry.register(new ClaimCommand());
  registry.register(new NodesCommand());
  registry.register(new CortexCommand());
  registry.register(new HealthCommand());
  registry.register(new SocialCommand());
  registry.register(new LeaderboardCommand());
  registry.register(new EasterCommand());
  registry.register(new HousingCommand());
  registry.register(new TelemetryCommand());
  registry.register(new EsgCommand());
  registry.register(new RehousedCommand());
  registry.register(new GrantsCommand());
  registry.register(new BookCommand());
  registry.register(new CrewCommand());
  registry.register(new JokeCommand());
  registry.register(new TriviaCommand());
  registry.register(new PlayCommand());
  registry.register(new DeepCommand());
  registry.register(new MeshwordCommand());
  registry.register(new ChainCommand());
  registry.register(new ParadoxCommand());
  registry.register(new HangmanCommand());
  registry.register(new DriftCommand());
  registry.register(new LoreCommand());
  registry.register(new TetraCommand());
  registry.register(new QClockCommand());
  registry.register(new HelpCommand(registry));
}

export function createBotRegistry(): CommandRegistry {
  const registry = createCommandRegistry();
  registerAllCommands(registry);
  return registry;
}
