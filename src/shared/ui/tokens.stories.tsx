import type { Meta, StoryObj } from '@storybook/react-vite';
import { notebookShadowRoles } from './tokens';
import { cn } from './utils';

const meta = {
  title: 'Tokens/Shadows',
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ElevationRoles: Story = {
  render: () => (
    <main className="flex min-h-dvh w-full items-center justify-center bg-[#f4f1ea] p-6 text-[#1a1a1a]">
      <section className="grid w-full max-w-5xl gap-4 font-mono">
        <header className="grid gap-2">
          <h1 className="text-2xl font-black uppercase tracking-widest">Shadow Roles</h1>
          <p className="text-sm font-bold text-[#5a554f]">
            One down-right light source. Depth changes by semantic elevation, not random direction.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-5">
          {Object.entries(notebookShadowRoles).map(([role, shadow]) => (
            <div
              key={role}
              className={cn(
                'rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] p-3 text-center uppercase',
                shadow
              )}
            >
              {role}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
};
