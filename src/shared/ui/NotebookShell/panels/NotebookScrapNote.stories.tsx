import type { Meta, StoryObj } from '@storybook/react-vite';
import { NotebookScrapNote } from './NotebookScrapNote';

const meta = {
  title: 'Game Shell/Notebook Shell/Panels/Notebook Scrap Note',
  component: NotebookScrapNote,
  args: {
    children: 'Only content-bearing scraps make it into v1.'
  }
} satisfies Meta<typeof NotebookScrapNote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tones: Story = {
  render: (args) => (
    <div className="flex min-h-64 flex-wrap items-center justify-center gap-6 bg-[#f4f1ea] p-6">
      <NotebookScrapNote {...args} tone="yellow" />
      <NotebookScrapNote {...args} tone="paper" />
      <NotebookScrapNote {...args} tone="blue" />
    </div>
  )
};
