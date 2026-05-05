import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookOpen, RotateCcw, X } from 'lucide-react';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  args: {
    children: 'Open sketch'
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4 p-6">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="floating" icon={<BookOpen className="h-4 w-4" />}>
        Floating
      </Button>
      <Button variant="ghost">Ghost link</Button>
      <Button variant="icon" aria-label="Close">
        <X className="h-4 w-4" />
      </Button>
      <Button variant="control" className="h-16 w-16 p-0 text-2xl">
        ↑
      </Button>
    </div>
  )
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4 p-6">
      <Button disabled variant="primary">Locked</Button>
      <Button disabled variant="secondary" icon={<RotateCcw className="h-4 w-4" />}>
        Reset
      </Button>
    </div>
  )
};
