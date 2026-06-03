import type { Meta, StoryObj } from '@storybook/react';
import { BalanceCard } from '@/components/BalanceCard';
import { StoryShell } from '@/storybook/decorators';

const meta = {
  title: 'TimeOff/BalanceCard',
  component: BalanceCard,
  decorators: [(Story) => <StoryShell><Story /></StoryShell>],
} satisfies Meta<typeof BalanceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    locationName: 'New York',
    daysAvailable: null,
    state: 'loading',
  },
};

export const Empty: Story = {
  args: {
    locationName: 'New York',
    daysAvailable: null,
    state: 'empty',
  },
};

export const Fresh: Story = {
  args: {
    locationName: 'New York',
    daysAvailable: 12,
    asOf: new Date().toISOString(),
    state: 'fresh',
  },
};

export const Stale: Story = {
  args: {
    locationName: 'San Francisco',
    daysAvailable: 8,
    asOf: new Date(Date.now() - 120_000).toISOString(),
    state: 'stale',
    stale: true,
  },
};

export const OptimisticPending: Story = {
  args: {
    locationName: 'New York',
    daysAvailable: 10,
    asOf: new Date().toISOString(),
    state: 'optimisticPending',
  },
};

export const OptimisticRolledBack: Story = {
  args: {
    locationName: 'New York',
    daysAvailable: 12,
    asOf: new Date().toISOString(),
    state: 'optimisticRolledBack',
  },
};

export const BalanceRefreshedMidSession: Story = {
  args: {
    locationName: 'London',
    daysAvailable: 8,
    asOf: new Date().toISOString(),
    state: 'balanceRefreshedMidSession',
  },
};
