import type { Meta, StoryObj } from '@storybook/react';
import { RequestHistory } from '@/components/RequestHistory';
import { sampleRequests } from '@/storybook/fixtures';
import { StoryShell } from '@/storybook/decorators';

const meta = {
  title: 'TimeOff/RequestHistory',
  component: RequestHistory,
  decorators: [(Story) => <StoryShell><Story /></StoryShell>],
} satisfies Meta<typeof RequestHistory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    requests: [],
  },
};

export const MixedStatuses: Story = {
  args: {
    requests: sampleRequests,
  },
};

export const SilentWrongRecovery: Story = {
  args: {
    requests: sampleRequests,
    variant: 'silentWrongRecovery',
  },
};
