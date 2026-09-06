import type { Meta, StoryObj } from '@storybook/react';
import { GlassCard } from '@p31/design-core/generated/GlassCard';

const meta: Meta<typeof GlassCard> = { component: GlassCard, title: 'UI/GlassCard' };
export default meta;
type Story = StoryObj<typeof GlassCard>;

export const Default: Story = { args: { children: <div style={{ padding: 24, color: '#f0f2f5' }}>Glass card content</div> } };
export const Strong: Story = { args: { strong: true, children: <div style={{ padding: 24, color: '#f0f2f5' }}>Strong glass card</div> } };
