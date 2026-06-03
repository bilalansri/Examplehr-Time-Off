import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { ApprovalPanel } from '@/components/ApprovalPanel';
import { sampleRequests } from '@/storybook/fixtures';
import { StoryShell } from '@/storybook/decorators';

const meta = {
  title: 'TimeOff/ApprovalPanel',
  component: ApprovalPanel,
  decorators: [(Story) => <StoryShell><Story /></StoryShell>],
  args: {
    onApprove: fn(),
    onDeny: fn(),
  },
} satisfies Meta<typeof ApprovalPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const pendingRequest = sampleRequests[0];

export const Idle: Story = {
  args: {
    request: pendingRequest,
    decisionBalance: 12,
    decisionAsOf: new Date().toISOString(),
    state: 'idle',
  },
};

export const FetchingBalance: Story = {
  args: {
    request: pendingRequest,
    decisionBalance: null,
    state: 'fetchingBalance',
  },
};

export const Approving: Story = {
  args: {
    request: pendingRequest,
    decisionBalance: 12,
    decisionAsOf: new Date().toISOString(),
    state: 'approving',
  },
};

export const HcmRejected: Story = {
  args: {
    request: pendingRequest,
    decisionBalance: 1,
    decisionAsOf: new Date().toISOString(),
    state: 'hcmRejected',
    errorMessage: 'Insufficient balance at approval time',
  },
};

export const Conflict409: Story = {
  args: {
    request: pendingRequest,
    decisionBalance: 1,
    decisionAsOf: new Date().toISOString(),
    state: 'conflict409',
    errorMessage: 'Balance changed since review. Approval rejected.',
  },
};

export const SilentlyWrong: Story = {
  args: {
    request: pendingRequest,
    decisionBalance: 12,
    decisionAsOf: new Date().toISOString(),
    state: 'silentlyWrong',
  },
};

export const NoSelection: Story = {
  args: {
    request: null,
    decisionBalance: null,
    state: 'idle',
  },
};
