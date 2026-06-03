import type { Meta, StoryObj } from '@storybook/react';
import { EmployeeView } from '@/components/EmployeeView';
import { withQueryClient } from '@/storybook/decorators';

const meta = {
  title: 'Pages/EmployeePage',
  component: EmployeeView,
  decorators: [withQueryClient()],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof EmployeeView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
