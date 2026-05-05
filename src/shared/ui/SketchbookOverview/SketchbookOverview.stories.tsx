import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookOpen, Gamepad2 } from 'lucide-react';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card, Panel } from '../Card';
import { LinkButton } from '../LinkButton';
import { SketchSection } from '../SketchSection';

const meta = {
  title: 'UI/Sketchbook Overview'
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SystemSnapshot: Story = {
  render: () => (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 p-6 text-[#1a1a1a]">
      <header className="flex flex-col gap-3 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#1a1a1a]/60">
          Digital Sketchbook UI
        </p>
        <h1 className="text-4xl font-bold">Reusable Portfolio Pieces</h1>
      </header>

      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="floating" icon={<BookOpen className="h-4 w-4" />}>
          Static mode
        </Button>
        <Button variant="floating" icon={<Gamepad2 className="h-4 w-4" />}>
          Interactive
        </Button>
      </div>

      <SketchSection id="overview-project" title="Project">
        <Card>
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge>React</Badge>
            <Badge>Vite</Badge>
            <Badge tone="highlight">Recommended</Badge>
          </div>
          <h2 className="mb-2 text-2xl font-bold">Gamified Portfolio</h2>
          <p className="mb-6 text-base leading-relaxed text-gray-700">
            Thick ink borders, cream paper, and hard shadows are centralized for reuse.
          </p>
          <LinkButton href="#" variant="primary">
            View more
          </LinkButton>
        </Card>
      </SketchSection>

      <Panel className="text-center">
        <p className="text-sm font-bold uppercase tracking-widest">
          A compact panel for hints, loading states, and inventory.
        </p>
      </Panel>
    </main>
  )
};
