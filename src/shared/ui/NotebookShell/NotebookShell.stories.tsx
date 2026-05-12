import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import {
  ControlMat,
  NotebookHeaderChrome,
  NotebookMenuSheet,
  NotebookPageFrame,
  NotebookScrapNote,
  NotebookShellStage,
  NotebookSpread,
  SceneChoiceCard,
  SceneChoiceGrid,
  SceneHintSlip,
  ScenePanelSheet,
  SceneStatusSlip,
  type NotebookSceneProfile
} from './NotebookShell';
import { cn } from '../utils';

const meta = {
  title: 'Game Shell/Notebook Shell',
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface ArcadePreviewProps {
  profile: NotebookSceneProfile;
  title: string;
  status: string;
  meterValue: number;
  footer: string;
  panel?: ReactElement;
  children: ReactElement;
}

function ArcadePreview({
  profile,
  title,
  status,
  meterValue,
  footer,
  panel,
  children
}: ArcadePreviewProps) {
  return (
    <StoryCanvas>
      <NotebookShellStage
        profile={profile}
        layout="focus"
        header={<NotebookHeaderChrome />}
        footer={<SceneHintSlip label={footer} />}
        panel={panel}
      >
        <ControlMat
          label={profile === 'ruledBoardPage' ? 'input mat wider than board' : 'full surface input zone'}
        >
          <NotebookPageFrame
            profile={profile}
            className={cn(
              'absolute inset-x-5 bottom-12 top-20 sm:inset-x-8 sm:bottom-8 md:inset-x-16',
              '[@media(max-height:420px)]:inset-x-24 [@media(max-height:420px)]:bottom-5 [@media(max-height:420px)]:top-14'
            )}
            status={
              <SceneStatusSlip
                metric={title}
                label={status}
                meterValue={meterValue}
                variant="chip"
                className="absolute left-4 top-4 z-10"
              />
            }
          >
            {children}
          </NotebookPageFrame>
        </ControlMat>
      </NotebookShellStage>
    </StoryCanvas>
  );
}

function StoryCanvas({
  children,
  className
}: {
  children: ReactElement;
  className?: string;
}) {
  return (
    <div className={cn('flex min-h-dvh w-full items-center justify-center bg-[#f4f1ea]', className)}>
      {children}
    </div>
  );
}

function NotesBlock({
  title,
  lines,
  scrap
}: {
  title: string;
  lines: readonly string[];
  scrap: string;
}) {
  return (
    <div className="grid content-start gap-2 font-mono">
      <div className="grid gap-2 text-xs font-bold leading-relaxed text-[#5a554f]">
        <strong className="text-base uppercase tracking-widest text-[#1a1a1a]">{title}</strong>
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
      <div className="border-l-4 border-[#1a1a1a]/75 pl-3 text-xs font-bold uppercase tracking-widest text-[#5a554f]">
        Notes explain state without crowding the active page.
      </div>
      <NotebookScrapNote>{scrap}</NotebookScrapNote>
    </div>
  );
}

function RuledBoardMockPlayfield() {
  return (
    <div className="absolute inset-0">
      <span className="absolute left-[35%] top-[30%] h-5 w-5 rounded-full bg-[#1a1a1a]/55" />
      <span className="absolute left-[64%] top-[42%] h-4 w-4 rounded-full bg-[#1a1a1a]/45" />
      <span className="absolute left-[47%] top-[57%] h-5 w-5 rounded-full bg-[#1a1a1a]/55" />
      <span className="absolute bottom-[12%] left-1/2 h-20 w-20 -translate-x-1/2 rounded-full border-4 border-[#1a1a1a] bg-[#fbfbf9]">
        <span className="absolute left-1/2 top-1/2 h-10 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d9c276]" />
      </span>
    </div>
  );
}

function SurvivalMockPlayfield() {
  return (
    <div className="absolute inset-0">
      <span className="absolute left-[24%] top-[33%] h-4 w-4 rounded-full bg-[#1a1a1a]/55" />
      <span className="absolute left-[65%] top-[28%] h-3.5 w-3.5 rounded-full bg-[#1a1a1a]/45" />
      <span className="absolute left-[48%] top-[48%] h-6 w-6 rounded-full bg-[#1a1a1a]/60" />
      <span className="absolute left-[72%] top-[66%] h-4 w-4 rounded-full bg-[#1a1a1a]/50" />
      <span className="absolute left-[37%] top-[76%] h-3 w-3 rounded-full bg-[#1a1a1a]/40" />
      <span className="absolute left-1/2 top-[61%] h-12 w-8 -translate-x-1/2 -translate-y-1/2 rounded-t-xl rounded-b border-4 border-[#1a1a1a] bg-[#fbfbf9]">
        <span className="absolute -right-2 top-2 h-3 w-3 rounded-full bg-[#1a1a1a]" />
      </span>
    </div>
  );
}

function SideViewMockPlayfield() {
  return (
    <div className="absolute inset-0">
      <span className="absolute bottom-[28%] left-[6%] right-[6%] h-1 rotate-[-4deg] rounded-full bg-[#1a1a1a]/80" />
      <span className="absolute bottom-[24%] left-[9%] h-[34%] w-[82%] rounded-t-[60%] border-4 border-b-0 border-[#1a1a1a]/85" />
      <span className="absolute bottom-[34%] left-[72%] h-20 w-5 border-4 border-[#1a1a1a] bg-[#fbfbf9]" />
      <span className="absolute bottom-[34%] left-[22%] h-6 w-12 border-4 border-[#1a1a1a] bg-[#fbfbf9]" />
      <span className="absolute left-1/2 top-[61%] h-12 w-8 -translate-x-1/2 -translate-y-1/2 rounded-t-xl rounded-b border-4 border-[#1a1a1a] bg-[#fbfbf9]" />
    </div>
  );
}

export const RuledBoardFocus: Story = {
  render: () => (
    <ArcadePreview
      profile="ruledBoardPage"
      title="Phase"
      status="stable state"
      meterValue={42}
      footer="input hint"
    >
      <RuledBoardMockPlayfield />
    </ArcadePreview>
  )
};

export const RuledBoardChoicePanel: Story = {
  render: () => (
    <ArcadePreview
      profile="ruledBoardPage"
      title="Phase"
      status="choice pending"
      meterValue={62}
      footer="choice state"
      panel={
        <ScenePanelSheet
          title="Choose Option"
          body={
            <SceneChoiceGrid>
              <SceneChoiceCard
                title="Choice A"
                description="Primary option with a short readable effect."
                tone="yellow"
              />
              <SceneChoiceCard
                title="Choice B"
                description="Secondary option with comparable copy length."
                tone="red"
              />
            </SceneChoiceGrid>
          }
          placement="wide"
        />
      }
    >
      <RuledBoardMockPlayfield />
    </ArcadePreview>
  )
};

export const RuledBoardTerminalPanel: Story = {
  render: () => (
    <ArcadePreview
      profile="ruledBoardPage"
      title="Phase"
      status="complete"
      meterValue={100}
      footer="run summary"
      panel={
        <ScenePanelSheet
          title="Run Ended"
          body="Summary copy stays readable and actions remain reachable on narrow screens."
          actionsLayout="auto"
          placement="centered"
          actions={[
            { label: 'Retry', variant: 'primary' },
            { label: 'Return', variant: 'secondary' }
          ]}
        />
      }
    >
      <RuledBoardMockPlayfield />
    </ArcadePreview>
  )
};

export const SurvivalFocus: Story = {
  render: () => (
    <ArcadePreview
      profile="survivalPage"
      title="Timer"
      status="active"
      meterValue={38}
      footer="full surface input zone"
    >
      <SurvivalMockPlayfield />
    </ArcadePreview>
  )
};

export const SurvivalStartPanel: Story = {
  render: () => (
    <ArcadePreview
      profile="survivalPage"
      title="Timer"
      status="ready"
      meterValue={0}
      footer="tap to start"
      panel={
        <ScenePanelSheet
          title="Ready?"
          body="Start sheets are allowed because gameplay has not begun yet."
          actionsLayout="auto"
          placement="centered"
          actions={[
            { label: 'Start', variant: 'primary' },
            { label: 'Back', variant: 'secondary' }
          ]}
        />
      }
    >
      <SurvivalMockPlayfield />
    </ArcadePreview>
  )
};

export const SurvivalResultPanel: Story = {
  render: () => (
    <ArcadePreview
      profile="survivalPage"
      title="Timer"
      status="complete"
      meterValue={100}
      footer="result summary"
      panel={
        <ScenePanelSheet
          title="Result Panel"
          body="A result sheet can dominate the page because the run is paused."
          actionsLayout="auto"
          placement="centered"
          actions={[
            { label: 'Retry', variant: 'primary' },
            { label: 'Back', variant: 'secondary' }
          ]}
        />
      }
    >
      <SurvivalMockPlayfield />
    </ArcadePreview>
  )
};

export const SideViewSpread: Story = {
  render: () => (
    <StoryCanvas>
      <NotebookShellStage
        profile="sideViewPage"
        layout="spread"
        header={<NotebookHeaderChrome />}
        footer={<SceneHintSlip label="side-view profile hint" />}
      >
        <ControlMat label="side-view interaction surface" showGuide={false}>
          <NotebookSpread
            profile="sideViewPage"
            notes={
              <NotesBlock
                title="Side-View Notes"
                lines={[
                  'Spread works when notes carry low-density state.',
                  'The playable page stays quiet during movement.',
                  'Blocking panels appear as loose sheets only.'
                ]}
                scrap="compact menu holds secondary actions"
              />
            }
            status={<SceneStatusSlip metric="Status" label="quiet state" meterValue={24} variant="chip" className="absolute left-5 top-5 z-10" />}
          >
            <SideViewMockPlayfield />
          </NotebookSpread>
        </ControlMat>
      </NotebookShellStage>
    </StoryCanvas>
  )
};

export const ChoiceAndHintAtoms: Story = {
  render: () => (
    <StoryCanvas>
      <section className="grid w-full max-w-5xl gap-5 p-4 font-mono">
        <h2 className="text-2xl font-black uppercase tracking-widest">Choice + Hint Atoms</h2>
        <SceneChoiceGrid>
          <SceneChoiceCard
            title="Choice A"
            description="Selected option with concise supporting copy."
            tone="blue"
            selected
          />
          <SceneChoiceCard
            title="Choice B"
            description="Unselected option with comparable copy."
            tone="red"
          />
        </SceneChoiceGrid>
        <SceneHintSlip label="context hint for the current state" />
      </section>
    </StoryCanvas>
  )
};

export const MenuAndScrapAtoms: Story = {
  render: () => (
    <StoryCanvas>
      <section className="grid w-full max-w-3xl justify-items-center gap-5 p-4 font-mono">
        <NotebookMenuSheet
          title="Menu"
          items={[
            { label: 'Static Mode', detail: 'Open the readable portfolio page.' },
            { label: 'Inventory', detail: 'Pocket notes and collected stamps.' },
            { label: 'Dev', detail: 'Prototype tools.' }
          ]}
        />
        <NotebookScrapNote>Only content-bearing scraps make it into v1.</NotebookScrapNote>
      </section>
    </StoryCanvas>
  )
};
