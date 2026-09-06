import type { Meta, StoryObj } from '@storybook/react';
import { GlowButton } from '../chrome/GlowButton';

const meta: Meta<typeof GlowButton> = { component: GlowButton, title: 'UI/GlowButton' };
export default meta;
type Story = StoryObj<typeof GlowButton>;

export const Cyan: Story = { args: { children: 'Cyan', color: 'cyan' } };
export const Violet: Story = { args: { children: 'Violet', color: 'violet' } };
export const Gold: Story = { args: { children: 'Gold', color: 'gold' } };
export const Green: Story = { args: { children: 'Green', color: 'green' } };
export const Rose: Story = { args: { children: 'Rose', color: 'rose' } };
export const Small: Story = { args: { children: 'Small', size: 'sm' } };
export const Large: Story = { args: { children: 'Large', size: 'lg' } };
