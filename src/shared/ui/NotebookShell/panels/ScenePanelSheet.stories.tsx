import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScenePanelSheet } from './ScenePanelSheet';

const meta = {
  title: 'Game Shell/Notebook Shell/Panels/Scene Panel Sheet',
  component: ScenePanelSheet,
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    title: 'Run Ended',
    body: 'Summary copy stays readable and actions remain reachable on narrow screens.',
    actions: [
      { label: 'Retry', variant: 'primary' },
      { label: 'Return', variant: 'secondary' }
    ]
  }
} satisfies Meta<typeof ScenePanelSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Centered: Story = {
  render: (args) => (
    <div className="relative h-dvh min-h-[32rem] w-full overflow-hidden bg-[#f4f1ea]">
      <div className="absolute inset-6 rounded-2xl border-4 border-[#1a1a1a] bg-[#fbfbf9]" />
      <ScenePanelSheet {...args} />
    </div>
  )
};
