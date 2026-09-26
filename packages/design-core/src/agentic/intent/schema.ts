import { z } from 'zod';

/** WCAG conformance target for a generated component. */
export const accessibilitySchema = z.object({
  wcag: z.enum(['AA', 'AAA']).default('AAA'),
  /** minimum contrast ratio (e.g. 4.5 or 7) */
  contrast: z.number().min(1).max(21).default(7),
  motionPreference: z.enum(['respect', 'reduce']).default('respect'),
  touchTarget: z.number().min(24).default(48),
});

export const spoonBehaviorSchema = z.object({
  motion: z.string(),
  blur: z.string(),
  opacity: z.string(),
  interaction: z.enum(['essential-only', 'normal', 'enhanced', 'full']),
});

export const performanceSchema = z.object({
  /** gzipped bundle budget in KB */
  bundle: z.number().default(3),
  /** render frame budget in ms */
  renderTime: z.number().default(16.67),
  devices: z.array(z.string()).default(['iPhone SE 1', 'iPad Air 2']),
});

export const loveSemanticsSchema = z.object({
  trigger: z.string(),
  reward: z.number().min(0).max(10),
  recipient: z.array(z.enum(['user', 'caregiver', 'system'])).min(1),
  description: z.string().optional(),
});

export const variantSchema = z.object({
  name: z.string(),
  description: z.string(),
  color: z.enum(['accent', 'neutral', 'danger', 'success', 'warning', 'teal', 'purple', 'coral', 'pink']),
  icon: z.string().optional(),
});

export const intentSpecSchema = z.object({
  component: z.string().min(1),
  narrative: z.string().min(20, 'narrative must explain the human need (Gemini contract)'),
  constraints: z
    .object({
      accessibility: accessibilitySchema.default({}),
      spoonAware: z.union([z.boolean(), z.array(z.number())]).default(true),
      performance: performanceSchema.default({}),
      loveSemantics: z.array(loveSemanticsSchema).default([]),
    })
    .default({}),
  variants: z.array(variantSchema).default([]),
  interactions: z
    .array(
      z.object({
        event: z.string(),
        condition: z.string().default('always'),
        action: z.string(),
        motion: z.string().default('none'),
        reward: z.string().optional(),
      })
    )
    .default([]),
  accessibilityNotes: z.array(z.string()).default([]),
});

export type IntentSpec = z.infer<typeof intentSpecSchema>;
export type SpoonBehavior = z.infer<typeof spoonBehaviorSchema>;
