import type { Meta, StoryObj } from '@storybook/react-vite';
import { DialogCard } from './DialogCard';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { ModalShell } from '../ModalShell';

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
    <ModalShell onClose={() => undefined}>
      {({ titleId, descriptionId }) => (
        <DialogCard
          title="Projects"
          description="Selected scraps from the sketchbook."
          onClose={() => undefined}
          titleId={titleId}
          descriptionId={descriptionId}
        >
          <div className="grid gap-4">
            <p className="text-base leading-relaxed">
              The modal shell owns ARIA labeling, initial focus, Escape close, and Tab focus wrapping.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge>Accessible</Badge>
              <Badge>Reusable</Badge>
            </div>
            <Button variant="primary">View more</Button>
          </div>
        </DialogCard>
      )}
    </ModalShell>
  )
};
