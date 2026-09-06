import type { Meta, StoryObj } from '@storybook/react';
import { SovereigntyStrip } from '../chrome/SovereigntyStrip';

const meta: Meta<typeof SovereigntyStrip> = { component: SovereigntyStrip, title: 'Chrome/SovereigntyStrip' };
export default meta;
type Story = StoryObj<typeof SovereigntyStrip>;

export const Default: Story = { args: { appName: 'P31CA' } };
export const CustomMessage: Story = { args: { appName: 'PHOS', noPassportMessage: 'Your identity stays on this device.' } };
