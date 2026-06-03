import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { ReconciliationBanner } from '@/components/ReconciliationBanner';
import { StoryShell } from '@/storybook/decorators';

const meta = {
  title: 'TimeOff/ReconciliationBanner',
  component: ReconciliationBanner,
  decorators: [(Story) => <StoryShell><Story /></StoryShell>],
  args: {
    onRefresh: fn(),
  },
} satisfies Meta<typeof ReconciliationBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hidden: Story = {
  args: {
    variant: 'hidden',
  },
};

export const AnniversaryDetected: Story = {
  args: {
    variant: 'anniversary',
  },
};

export const MismatchDetected: Story = {
  args: {
    variant: 'mismatch',
  },
};
