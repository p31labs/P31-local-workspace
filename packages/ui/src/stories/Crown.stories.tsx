import type { Meta, StoryObj } from '@storybook/react';
import { Crown, type CrownProps } from '@p31ca/ui/chrome';

const meta: Meta<typeof Crown> = {
  component: Crown,
  title: 'UI/Crown',
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
    brand: {
      control: 'select',
      options: ['p31ca', 'phosphorus', 'phos', 'willow'],
    },
    inverted: {
      control: 'boolean',
    },
    animated: {
      control: 'boolean',
      defaultValue: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof Crown>;

export const XS: Story = {
  args: { size: 'xs', brand: 'p31ca' },
};

export const SM: Story = {
  args: { size: 'sm', brand: 'p31ca' },
};

export const MD: Story = {
  args: { size: 'md', brand: 'p31ca' },
};

export const LG: Story = {
  args: { size: 'lg', brand: 'p31ca' },
};

export const BrandP31ca: Story = {
  args: { size: 'md', brand: 'p31ca' },
};

export const BrandPhosphorus: Story = {
  args: { size: 'md', brand: 'phosphorus' },
};

export const BrandPhos: Story = {
  args: { size: 'md', brand: 'phos' },
};

export const BrandWillow: Story = {
  args: { size: 'md', brand: 'willow' },
};

export const Inverted: Story = {
  args: { size: 'md', brand: 'p31ca', inverted: true },
};

export const Playground: Story = {
  args: { size: 'md', brand: 'p31ca' },
  render: ({ animated, ...props }: CrownProps & { animated?: boolean }) => (
    <div style={animated === false ? { animation: 'none !important' } : undefined}>
      <Crown {...props} />
    </div>
  ),
};
