import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { PendingQueue } from '@/components/PendingQueue';
import { sampleRequests } from '@/storybook/fixtures';
import { StoryShell } from '@/storybook/decorators';

const meta = {
  title: 'TimeOff/PendingQueue',
  component: PendingQueue,
  decorators: [(Story) => <StoryShell><Story /></StoryShell>],
  args: {
    onSelect: fn(),
  },
} satisfies Meta<typeof PendingQueue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    requests: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    requests: [],
    isLoading: false,
  },
};

export const WithItems: Story = {
  args: {
    requests: sampleRequests.filter((request) => request.status === 'pending'),
    isLoading: false,
    selectedId: 'req-1',
  },
};
