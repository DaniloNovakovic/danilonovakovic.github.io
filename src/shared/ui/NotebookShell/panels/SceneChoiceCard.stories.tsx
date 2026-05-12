import type { Meta, StoryObj } from '@storybook/react-vite';
import { SceneChoiceCard } from './SceneChoiceCard';
import { SceneChoiceGrid } from './SceneChoiceGrid';

const meta = {
  title: 'Game Shell/Notebook Shell/Panels/Scene Choice Card',
  component: SceneChoiceCard
} satisfies Meta<typeof SceneChoiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Options: Story = {
  args: {
    title: 'Choice A',
    description: 'Selected option with concise supporting copy.'
  },
  render: () => (
    <div className="flex min-h-64 items-center justify-center bg-[#f4f1ea] p-6">
      <SceneChoiceGrid>
        <SceneChoiceCard
          title="Choice A"
          description="Selected option with concise supporting copy."
          tone="blue"
          selected
        />
        <SceneChoiceCard
          title="Choice B"
          description="Unselected option with comparable copy."
          tone="red"
        />
      </SceneChoiceGrid>
    </div>
  )
};
