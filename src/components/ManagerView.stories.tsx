import type { Meta, StoryObj } from '@storybook/react';
import { ManagerView } from '@/components/ManagerView';
import { withQueryClient } from '@/storybook/decorators';

const meta = {
  title: 'Pages/ManagerPage',
  component: ManagerView,
  decorators: [withQueryClient()],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof ManagerView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
