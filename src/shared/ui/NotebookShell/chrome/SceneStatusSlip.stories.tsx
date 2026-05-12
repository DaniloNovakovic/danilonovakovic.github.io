import type { Meta, StoryObj } from '@storybook/react-vite';
import { SceneStatusSlip } from './SceneStatusSlip';

const meta = {
  title: 'Game Shell/Notebook Shell/Chrome/Scene Status Slip',
  component: SceneStatusSlip,
  args: {
    metric: 'Timer',
    label: 'active',
    meterValue: 38
  }
} satisfies Meta<typeof SceneStatusSlip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bar: Story = {
  render: (args) => (
    <div className="flex min-h-48 items-center justify-center bg-[#f4f1ea] p-6">
      <SceneStatusSlip {...args} />
    </div>
  )
};

export const Chip: Story = {
  args: {
    metric: 'Phase',
    label: 'choice pending',
    meterValue: 62,
    variant: 'chip'
  },
  render: (args) => (
    <div className="flex min-h-48 items-center justify-center bg-[#f4f1ea] p-6">
      <SceneStatusSlip {...args} />
    </div>
  )
};
