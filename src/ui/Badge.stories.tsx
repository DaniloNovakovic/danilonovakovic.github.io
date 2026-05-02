import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Tag } from './Badge';

const meta = {
  title: 'UI/Badge',
  component: Badge
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 p-6">
      <Badge tone="neutral">React</Badge>
      <Badge tone="paper">Portfolio</Badge>
      <Badge tone="highlight">Recommended</Badge>
      <Badge tone="ink">Active</Badge>
      <Badge shape="pill" className="font-mono text-sm normal-case tracking-normal">
        2024 - present
      </Badge>
      <Tag>TypeScript</Tag>
    </div>
  )
};
