import type { Meta, StoryObj } from '@storybook/react-vite';
import { NotebookMenuSheet } from './NotebookMenuSheet';

const meta = {
  title: 'Game Shell/Notebook Shell/Panels/Notebook Menu Sheet',
  component: NotebookMenuSheet,
  args: {
    title: 'Menu',
    items: [
      { label: 'Static Mode', detail: 'Open the readable portfolio page.' },
      { label: 'Inventory', detail: 'Pocket notes and collected stamps.' },
      { label: 'Dev', detail: 'Prototype tools.' }
    ]
  }
} satisfies Meta<typeof NotebookMenuSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-96 items-center justify-center bg-[#f4f1ea] p-6">
      <NotebookMenuSheet {...args} />
    </div>
  )
};
