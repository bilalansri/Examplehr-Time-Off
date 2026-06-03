import type { Meta, StoryObj } from '@storybook/react';
import { BalanceGrid } from '@/components/BalanceGrid';
import type { Balance } from '@/lib/hcm/types';
import { sampleBalances } from '@/storybook/fixtures';
import { StoryShell } from '@/storybook/decorators';

const meta = {
  title: 'TimeOff/BalanceGrid',
  component: BalanceGrid,
  decorators: [(Story) => <StoryShell><Story /></StoryShell>],
} satisfies Meta<typeof BalanceGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    balances: [],
    isLoading: true,
    isFetching: false,
    isBalanceStale: () => false,
  },
};

export const Fresh: Story = {
  args: {
    balances: sampleBalances,
    isLoading: false,
    isFetching: false,
    isBalanceStale: () => false,
  },
};

export const StaleFetching: Story = {
  args: {
    balances: sampleBalances,
    isLoading: false,
    isFetching: true,
    isBalanceStale: (_balance?: Balance) => true,
  },
};

export const OptimisticPending: Story = {
  args: {
    balances: sampleBalances.map((balance) =>
      balance.locationId === 'loc-nyc'
        ? { ...balance, daysAvailable: 10 }
        : balance,
    ),
    isLoading: false,
    isFetching: false,
    optimisticLocationId: 'loc-nyc',
    isBalanceStale: () => false,
  },
};
