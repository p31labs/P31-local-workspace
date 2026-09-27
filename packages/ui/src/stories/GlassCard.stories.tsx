import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GlassCard, type GlassCardProps } from '@p31ca/ui/chrome';

type GlassCardStoryProps = GlassCardProps & {
  color?: 'accent' | 'violet' | 'gold';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
};

const meta: Meta<typeof GlassCard> = {
  component: GlassCard,
  title: 'UI/GlassCard',
  argTypes: {
    color: {
      control: 'select',
      options: ['accent', 'violet', 'gold'],
      defaultValue: 'accent',
    },
    padding: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      defaultValue: 'lg',
    },
    interactive: {
      control: 'boolean',
      defaultValue: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof GlassCard>;

const PADDING_MAP: Record<string, string> = {
  sm: '12px',
  md: '20px',
  lg: '28px',
  xl: '40px',
};

const COLOR_STYLES: Record<string, React.CSSProperties> = {
  accent: {
    borderColor: 'var(--p31-accent, oklch(65% 0.18 195))',
    boxShadow: 'var(--p31-glow-cyan, 0 0 20px rgba(0,240,255,0.25))',
  },
  violet: {
    borderColor: 'var(--p31-accent-violet, oklch(65% 0.18 285))',
    boxShadow: 'var(--p31-glow-violet, 0 0 20px rgba(167,139,250,0.25))',
  },
  gold: {
    borderColor: 'var(--p31-accent-gold, oklch(65% 0.18 15))',
    boxShadow: 'var(--p31-glow-gold, 0 0 20px rgba(251,191,36,0.25))',
  },
};

const cardContent = (
  <div style={{ color: 'var(--p31-text, oklch(96% 0.005 240))' }}>
    <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem' }}>Glass Card</h3>
    <p style={{ margin: 0, color: 'var(--p31-text-secondary, oklch(75% 0.01 240))' }}>
      A glassmorphic container with backdrop blur and subtle border glow.
    </p>
  </div>
);

const renderCard = (args: GlassCardStoryProps) => {
  const { color, padding: paddingKey, interactive, ...componentProps } = args;
  const paddingVal = PADDING_MAP[paddingKey || 'lg'];
  return (
    <GlassCard
      {...componentProps}
      style={{
        ...(componentProps.style || {}),
        padding: paddingVal,
        ...(color && color !== 'accent' ? COLOR_STYLES[color] : {}),
        ...(interactive === false ? { pointerEvents: 'none', opacity: 0.6 } : {}),
      }}
    />
  );
};

export const Default: Story = {
  args: { children: cardContent },
};

export const Accent: Story = {
  args: { children: cardContent, color: 'accent' },
  render: renderCard,
};

export const Violet: Story = {
  args: { children: cardContent, color: 'violet' },
  render: renderCard,
};

export const Gold: Story = {
  args: { children: cardContent, color: 'gold' },
  render: renderCard,
};

export const Strong: Story = {
  args: { children: cardContent, strong: true },
};

export const Interactive: Story = {
  args: { children: cardContent, interactive: true },
  render: renderCard,
};

export const NonInteractive: Story = {
  args: { children: cardContent, interactive: false },
  render: renderCard,
};
