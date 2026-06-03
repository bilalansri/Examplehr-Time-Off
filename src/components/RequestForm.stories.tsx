import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { RequestForm } from '@/components/RequestForm';
import { sampleBalances } from '@/storybook/fixtures';
import { StoryShell } from '@/storybook/decorators';

const meta = {
  title: 'TimeOff/RequestForm',
  component: RequestForm,
  decorators: [(Story) => <StoryShell><Story /></StoryShell>],
  args: {
    balances: sampleBalances,
    onSubmit: fn(),
    isSubmitting: false,
  },
} satisfies Meta<typeof RequestForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    formState: 'idle',
  },
};

export const Submitting: Story = {
  args: {
    formState: 'submitting',
    isSubmitting: true,
  },
};

export const HcmRejected: Story = {
  args: {
    formState: 'hcmRejected',
    errorMessage: 'Not enough balance for this request',
  },
};

export const InsufficientBalance: Story = {
  args: {
    formState: 'insufficientBalance',
  },
};
