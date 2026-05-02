import type { Meta, StoryObj } from '@storybook/react-vite';
import { DialogCard } from './DialogCard';
import { Button } from './Button';
import { Badge } from './Badge';

const meta = {
  title: 'UI/DialogCard',
  component: DialogCard,
  args: {
    title: 'Projects',
    description: 'Selected scraps from the sketchbook.',
    onClose: () => undefined,
    children: null
  },
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta<typeof DialogCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OverlayShell: Story = {
  render: () => (
    <div className="flex min-h-[100dvh] items-center justify-center bg-black/40 p-4">
      <DialogCard
        title="Projects"
        description="Selected scraps from the sketchbook."
        onClose={() => undefined}
      >
        <div className="grid gap-4">
          <p className="text-base leading-relaxed">
            The dialog owns ARIA labeling, initial focus, Escape close, and Tab focus wrapping.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge>Accessible</Badge>
            <Badge>Reusable</Badge>
          </div>
          <Button variant="primary">View more</Button>
        </div>
      </DialogCard>
    </div>
  )
};
