import type { Meta, StoryObj } from '@storybook/react';
import { Footer } from '../chrome/Footer';

const meta: Meta<typeof Footer> = { component: Footer, title: 'Chrome/Footer' };
export default meta;
type Story = StoryObj<typeof Footer>;
export const Default: Story = {};
