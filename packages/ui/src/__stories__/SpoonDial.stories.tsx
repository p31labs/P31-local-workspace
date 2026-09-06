import type { Meta, StoryObj } from '@storybook/react';
import { SpoonDial } from '../chrome/SpoonDial';

const meta: Meta<typeof SpoonDial> = { component: SpoonDial, title: 'Chrome/SpoonDial' };
export default meta;
type Story = StoryObj<typeof SpoonDial>;

export const ButtonMode: Story = { args: { spoons: 3, setSpoons: () => {}, mode: 'button' } };
export const PipsMode: Story = { args: { spoons: 3, setSpoons: () => {}, mode: 'pips' } };
export const Crisis: Story = { args: { spoons: 0, setSpoons: () => {}, mode: 'pips' } };
