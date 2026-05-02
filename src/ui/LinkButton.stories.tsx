import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookOpen, Mail } from 'lucide-react';
import { LinkButton } from './LinkButton';

const meta = {
  title: 'UI/LinkButton',
  component: LinkButton
} satisfies Meta<typeof LinkButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 p-6">
      <LinkButton href="#" icon={<BookOpen className="h-4 w-4" />}>
        Portfolio
      </LinkButton>
      <LinkButton href="#" variant="primary" icon={<Mail className="h-4 w-4" />}>
        Email
      </LinkButton>
      <LinkButton href="#" variant="quiet" className="normal-case tracking-normal">
        Company link
      </LinkButton>
    </div>
  )
};
