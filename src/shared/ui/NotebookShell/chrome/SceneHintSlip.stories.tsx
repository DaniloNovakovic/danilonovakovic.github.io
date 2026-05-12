import type { Meta, StoryObj } from '@storybook/react-vite';
import { SceneHintSlip } from './SceneHintSlip';

const meta = {
  title: 'Game Shell/Notebook Shell/Chrome/Scene Hint Slip',
  component: SceneHintSlip,
  args: {
    label: 'drag toward a target',
    detail: 'hold to recall'
  }
} satisfies Meta<typeof SceneHintSlip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-48 items-center justify-center bg-[#f4f1ea] p-6">
      <SceneHintSlip {...args} />
    </div>
  )
};
