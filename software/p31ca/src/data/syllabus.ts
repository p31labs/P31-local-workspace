import type { LucideIcon } from 'lucide-react';
import { Shield, Zap, Terminal, Coffee, Lock, Smartphone, Database, Globe, ChevronRight } from 'lucide-react';

export interface SyllabusModule {
  id: string;
  title: string;
  classification: string;
  difficulty: string;
  icon: LucideIcon;
  summary: string;
  core: string;
}

export interface SyllabusVolume {
  id: number;
  volume: string;
  modules: SyllabusModule[];
}

export const SYLLABUS: SyllabusVolume[] = [
  {
    id: 1,
    volume: "VOLUME I: THE HARDWARE AND THE HUSTLE",
    modules: [
      {
        id: "01",
        title: "The Magic Screen",
        classification: "HIGHLY CONFIDENTIAL",
        difficulty: "Blue Steel",
        icon: Smartphone,
        summary: "The little laptop on the couch is an idiot. It is just an empty glass window called a Steering Wheel. It does no actual work. The real magic happens inside the loud box in the other room.",
        core: "By separating the Steering Wheel from the Engine, we achieve Sovereignty. If I spill coffee on the laptop, the Engine is safe. My lap stays cool, and we can summon AIs that would normally crush a regular computer. The files aren't IN the computer."
      },
      {
        id: "02",
        title: "The Big Brain in the Other Room",
        classification: "HIGHLY CONFIDENTIAL",
        difficulty: "Derelicte",
        icon: Database,
        summary: "In the other room is a loud, glowing box. Inside is a ridiculously buff bodybuilder (a Graphics Card) that lifts heavy mathematical weights so we don't have to.",
        core: "Normal people use 'The Cloud' for AI, which costs money and reads your diary. We downloaded a brain, shoved it into our own box, and locked the door. Absolute privacy. The question never leaves our house. Respect the box."
      },
      {
        id: "03",
        title: "The Invisible Walkie-Talkie",
        classification: "HIGHLY CONFIDENTIAL",
        difficulty: "Le Tigre",
        icon: Globe,
        summary: "The public internet is a crowded shopping mall filled with screaming children. We do not use it. We use a magic tunnel (Tailscale) to talk to the Engine.",
        core: "Our walkie-talkies have a highly exclusive VIP list (100.100.49.88). If a hacker tries to call, the phone doesn't ring. Distance is an illusion; I can be in Italy, but my laptop thinks it is sitting directly next to the Engine."
      },
      {
        id: "04",
        title: "The Virtual Balloon Trap",
        classification: "HIGHLY CONFIDENTIAL",
        difficulty: "Ferrari",
        icon: Terminal,
        summary: "Sometimes the computer says it's full, but it's lying. A software hoarder named Todd (Docker) keeps blowing up giant 50-gallon virtual balloons for tiny grapes, and leaving the empty balloons in the hallway.",
        core: "To fix this, we run the Master Storage Protocol: We yell at Todd to throw out his garbage, we knock him unconscious (wsl --shutdown), and we drive a virtual steamroller (diskpart) over the empty balloons to get our space back."
      },
      {
        id: "05",
        title: "The Magic Button",
        classification: "MAGNUM",
        difficulty: "Magnum",
        icon: Coffee,
        summary: "Setting up a computer is manual labor. We do not do manual labor. I type exactly three letters (p31) and summon a highly caffeinated digital butler.",
        core: "Because of my biological reality (Spoon Theory), setting up a workspace manually costs 4 Spoons. Typing p31 costs 1 Spoon. The butler builds a Panic Room, wakes the AI Beast, and syncs all files in 3 seconds. The friction is gone."
      }
    ]
  },
  {
    id: 2,
    volume: "VOLUME II: OUTFITS, SPARE TIRES, & REFEREES",
    modules: [
      {
        id: "06",
        title: "The Outfit Problem",
        classification: "HIGHLY CONFIDENTIAL",
        difficulty: "Blue Steel",
        icon: Zap,
        summary: "Computers normally force your complex human soul into a boring square box. We fixed this by separating the Data (The Soul) from the UI (The Outfit).",
        core: "Project Polyhedron lets the exact same data instantly change clothes. We have the Law Outfit (dense/serious), the Kid Outfit (bouncy/joyful), and the Accessibility Outfit (stark/high-contrast). The soul remains sovereign; the outfit is fluid."
      },
      {
        id: "07",
        title: "The Spoon Dial",
        classification: "HIGHLY CONFIDENTIAL",
        difficulty: "Ferrari",
        icon: Shield,
        summary: "If the internet dies, we don't crash. We trapped a tiny clone of the database inside the web browser (a spare tire in the Steering Wheel).",
        core: "The UI literally reads my biological energy. 1 Spoon = huge simple buttons. 3 Spoons = normal rhythm. 6 Spoons = God mode analytics. Technology molds to human biology, never the other way around."
      },
      {
        id: "08",
        title: "The Invisible Referee",
        classification: "MAGNUM",
        difficulty: "Magnum",
        icon: Lock,
        summary: "Since we don't use a billionaire's cloud server to watch us, we gave every family computer its own magical stopwatch (Hybrid Logical Clock).",
        core: "Every time a computer does a chore offline, it stamps it with an unbreakable math spell. When the Wi-Fi returns, they perfectly merge homework. If someone cheats, the cryptographic instant replay rejects them. Math is our referee."
      }
    ]
  },
  {
    id: 3,
    volume: "VOLUME III: WELCOME TO THE DELTA",
    modules: [
      {
        id: "09",
        title: "The VIP Pass",
        classification: "MAGNUM",
        difficulty: "Magnum",
        icon: Terminal,
        summary: "Passwords are for people who leave their keys under the welcome mat. To get into our network, you will be handed a physical envelope.",
        core: "Inside is a Magic Square (QR Code). Scanning it glues an un-stealable cryptographic key to your device's soul and instantly inflates a pop-up database in your browser. You just point your camera and step onto the runway."
      }
    ]
  }
];
