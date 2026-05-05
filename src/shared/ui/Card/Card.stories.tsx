import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, Panel } from './Card';
import { Badge } from '../Badge';

const meta = {
  title: 'UI/Card',
  component: Card
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PaperCutouts: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-6 p-6 sm:grid-cols-2">
      <Card>
        <h3 className="mb-2 text-xl font-bold">Project card</h3>
        <p className="mb-4 text-sm leading-relaxed text-gray-700">
          A reusable white paper surface for overlay and static portfolio content.
        </p>
        <div className="flex gap-2">
          <Badge>React</Badge>
          <Badge>Phaser</Badge>
        </div>
      </Card>
      <Panel>
        <h3 className="mb-2 text-xl font-bold">Panel</h3>
        <p className="text-sm leading-relaxed text-gray-700">
          A lighter framed panel for inventory, hints, and compact UI.
        </p>
      </Panel>
    </div>
  )
};
