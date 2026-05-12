import type { Meta, StoryObj } from '@storybook/react-vite';
import { SectionHeader } from './SectionHeader';

const meta = {
  title: 'UI/SectionHeader',
  component: SectionHeader,
  args: {
    id: 'section-heading',
    children: 'About'
  }
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="max-w-3xl p-6">
      <SectionHeader {...args} />
    </div>
  )
};
