import type { Meta, StoryObj } from '@storybook/react-vite';
import { SketchSection } from '../SketchSection';
import { Card } from '../Card';

const meta = {
  title: 'UI/SectionHeader',
  component: SketchSection,
  args: {
    id: 'about',
    title: 'About',
    children: null
  }
} satisfies Meta<typeof SketchSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StaticSection: Story = {
  render: () => (
    <div className="max-w-3xl p-6">
      <SketchSection id="about" title="About">
        <Card>
          <p className="text-base leading-relaxed text-gray-700">
            Static portfolio sections share the same ruled heading treatment.
          </p>
        </Card>
      </SketchSection>
    </div>
  )
};
