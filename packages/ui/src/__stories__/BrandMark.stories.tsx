import type { Meta, StoryObj } from '@storybook/react';
import { BrandMark } from '../chrome/BrandMark';

const meta: Meta<typeof BrandMark> = { component: BrandMark, title: 'Chrome/BrandMark' };
export default meta;
type Story = StoryObj<typeof BrandMark>;

export const PHOS: Story = { args: { appName: 'PHOS', tagline: 'ambient workspace' } };
export const WILLOW: Story = { args: { appName: 'WILLOW', tagline: 'delta portal', icon: '🌱' } };
export const Minimal: Story = { args: { appName: 'Labs' } };
