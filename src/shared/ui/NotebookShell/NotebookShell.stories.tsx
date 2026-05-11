import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import {
  ControlMat,
  NotebookHeaderChrome,
  NotebookPageFrame,
  NotebookShellStage,
  NotebookSpread,
  ScenePanelSheet,
  SceneStatusSlip,
  type NotebookSceneProfile,
  type NotebookViewport
} from './NotebookShell';
import { notebookShadowRoles } from '../tokens';
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
  viewport?: NotebookViewport;
  title: string;
  status: string;
  meterValue: number;
  footer: string;
  panel?: ReactElement;
  children: ReactElement;
}

function ArcadePreview({
  profile,
  viewport = 'desktopFocus',
  title,
  status,
  meterValue,
  footer,
  panel,
  children
}: ArcadePreviewProps) {
  const shouldShowFooter = viewport !== 'phoneLandscape';
  return (
    <StoryPad>
      <NotebookShellStage
        profile={profile}
        viewport={viewport}
        header={<NotebookHeaderChrome />}
        footer={shouldShowFooter ? <SceneStatusSlip metric={title} label={footer} meterValue={meterValue} /> : undefined}
        panel={panel}
      >
        <ControlMat
          label={profile === 'ruledBoardPage' ? 'drag mat wider than board' : 'whole page is playable'}
          showGuide={viewport !== 'phoneLandscape'}
        >
          <NotebookPageFrame
            profile={profile}
            className={cn(
              'absolute inset-x-8 bottom-16 top-20',
              viewport === 'phoneLandscape' ? 'inset-x-24 bottom-5 top-14' : '',
              viewport === 'phonePortrait' ? 'inset-x-5 bottom-16 top-20' : ''
            )}
            status={
              <SceneStatusSlip
                metric={title}
                label={status}
                meterValue={meterValue}
                variant="chip"
                className="absolute left-5 top-5 z-10"
              />
            }
          >
            {children}
          </NotebookPageFrame>
        </ControlMat>
      </NotebookShellStage>
    </StoryPad>
  );
}

function StoryPad({ children }: { children: ReactElement }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-[#f4f1ea] p-6">
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
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-4 font-mono">
      <div className="grid gap-3 text-sm font-bold leading-relaxed text-[#5a554f]">
        <strong className="text-base uppercase tracking-widest text-[#1a1a1a]">{title}</strong>
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
      <div className="border-l-4 border-[#1a1a1a]/75 pl-3 text-xs font-bold uppercase tracking-widest text-[#5a554f]">
        Quiet notes only. No permanent clutter in the danger space.
      </div>
      <div className={cn('w-fit rotate-[-2deg] border-2 border-[#1a1a1a] bg-[#d9c276] p-3 text-xs uppercase', notebookShadowRoles.control)}>
        {scrap}
      </div>
    </div>
  );
}

function PotassiumPlayfield() {
  return (
    <div className="absolute inset-0">
      {[18, 30, 42, 54, 66, 78].map((top) => (
        <span
          key={top}
          className="absolute left-[6%] right-[6%] h-0.5 bg-[#1a1a1a]/20"
          style={{ top: `${top}%` }}
        />
      ))}
      <span className="absolute left-[35%] top-[30%] h-5 w-5 rounded-full bg-[#1a1a1a]/55" />
      <span className="absolute left-[64%] top-[42%] h-4 w-4 rounded-full bg-[#1a1a1a]/45" />
      <span className="absolute left-[47%] top-[57%] h-5 w-5 rounded-full bg-[#1a1a1a]/55" />
      <span className="absolute bottom-[12%] left-1/2 h-20 w-20 -translate-x-1/2 rounded-full border-4 border-[#1a1a1a] bg-[#fbfbf9]">
        <span className="absolute left-1/2 top-1/2 h-10 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d9c276]" />
      </span>
    </div>
  );
}

function StampedePlayfield() {
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

function RidgePlayfield() {
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

export const PotassiumDesktopFocus: Story = {
  render: () => (
    <ArcadePreview
      profile="ruledBoardPage"
      title="W1"
      status="score 8"
      meterValue={42}
      footer="drag toward a target, hold to recall"
    >
      <PotassiumPlayfield />
    </ArcadePreview>
  )
};

export const PotassiumPhonePortrait: Story = {
  render: () => (
    <ArcadePreview
      profile="ruledBoardPage"
      viewport="phonePortrait"
      title="W1"
      status="score 8"
      meterValue={42}
      footer="drag toward a target"
    >
      <PotassiumPlayfield />
    </ArcadePreview>
  )
};

export const PotassiumPhoneLandscape: Story = {
  render: () => (
    <ArcadePreview
      profile="ruledBoardPage"
      viewport="phoneLandscape"
      title="W1"
      status="score 8"
      meterValue={42}
      footer="drag mat wider than board"
    >
      <PotassiumPlayfield />
    </ArcadePreview>
  )
};

export const PotassiumUpgradePanel: Story = {
  render: () => (
    <ArcadePreview
      profile="ruledBoardPage"
      title="W1"
      status="score 9"
      meterValue={62}
      footer="wave clear"
      panel={
        <ScenePanelSheet
          title="Choose Banana Nonsense"
          body="Upgrade sheets can stretch wider than the board because choosing is a paused, text-heavy moment."
          placement="wide"
          actions={[
            { label: 'Duplicate', variant: 'primary' },
            { label: 'Fire Trail', variant: 'secondary' }
          ]}
        />
      }
    >
      <PotassiumPlayfield />
    </ArcadePreview>
  )
};

export const PotassiumTerminalPanel: Story = {
  render: () => (
    <ArcadePreview
      profile="ruledBoardPage"
      viewport="phonePortrait"
      title="W1"
      status="lives 0"
      meterValue={100}
      footer="banana bankruptcy"
      panel={
        <ScenePanelSheet
          title="Banana Bankrupt"
          body="Final score 8. Terminal actions stay reachable on narrow screens."
          placement="mobileStacked"
          actions={[
            { label: 'Retry', variant: 'primary' },
            { label: 'Return', variant: 'secondary' }
          ]}
        />
      }
    >
      <PotassiumPlayfield />
    </ArcadePreview>
  )
};

export const StampedeDesktopFocus: Story = {
  render: () => (
    <ArcadePreview
      profile="survivalPage"
      title="1:08"
      status="kite ideas"
      meterValue={38}
      footer="whole page is your playground"
    >
      <StampedePlayfield />
    </ArcadePreview>
  )
};

export const StampedePhonePortrait: Story = {
  render: () => (
    <ArcadePreview
      profile="survivalPage"
      viewport="phonePortrait"
      title="1:08"
      status="kite ideas"
      meterValue={38}
      footer="tap or drag anywhere"
    >
      <StampedePlayfield />
    </ArcadePreview>
  )
};

export const StampedePhoneLandscape: Story = {
  render: () => (
    <ArcadePreview
      profile="survivalPage"
      viewport="phoneLandscape"
      title="1:08"
      status="kite ideas"
      meterValue={38}
      footer="edge status only"
    >
      <StampedePlayfield />
    </ArcadePreview>
  )
};

export const StampedeStartPanel: Story = {
  render: () => (
    <ArcadePreview
      profile="survivalPage"
      viewport="phonePortrait"
      title="1:15"
      status="ready"
      meterValue={0}
      footer="tap to start"
      panel={
        <ScenePanelSheet
          title="Ready?"
          body="Start sheets are allowed because gameplay has not begun yet."
          placement="mobileStacked"
          actions={[
            { label: 'Start', variant: 'primary' },
            { label: 'Back', variant: 'secondary' }
          ]}
        />
      }
    >
      <StampedePlayfield />
    </ArcadePreview>
  )
};

export const StampedeResultPanel: Story = {
  render: () => (
    <ArcadePreview
      profile="survivalPage"
      title="0:34"
      status="crowded"
      meterValue={100}
      footer="page got crowded"
      panel={
        <ScenePanelSheet
          title="Page Got Crowded"
          body="A result sheet can dominate the page because the run is paused."
          placement="centered"
          actions={[
            { label: 'Retry', variant: 'primary' },
            { label: 'Back', variant: 'secondary' }
          ]}
        />
      }
    >
      <StampedePlayfield />
    </ArcadePreview>
  )
};

export const RidgeOverworldDesktopSpread: Story = {
  render: () => (
    <StoryPad>
      <NotebookShellStage
        profile="sideViewPage"
        layout="spread"
        viewport="desktopSpread"
        header={<NotebookHeaderChrome />}
        footer={<SceneStatusSlip metric="Trail" label="side-view page, not an arcade board" />}
      >
        <ControlMat label="walk and interact on paper">
          <NotebookSpread
            profile="sideViewPage"
            notes={
              <NotesBlock
                title="Ridge / Overworld"
                lines={[
                  'Spread works when notes remember route state.',
                  'The playable page stays quiet during normal movement.',
                  'Trail Cards appear as blocking loose sheets only.'
                ]}
                scrap="static mode hides in menu"
              />
            }
            status={<SceneStatusSlip metric="Trail" label="quiet route" meterValue={24} variant="chip" className="absolute left-5 top-5 z-10" />}
          >
            <RidgePlayfield />
          </NotebookSpread>
        </ControlMat>
      </NotebookShellStage>
    </StoryPad>
  )
};

export const ShadowElevationRoles: Story = {
  render: () => (
    <StoryPad>
      <div className="grid w-[min(52rem,calc(100vw-2rem))] gap-4 rounded-lg border-4 border-[#1a1a1a] bg-[#fbfbf9] p-5 font-mono">
        <h2 className="text-2xl font-black uppercase tracking-widest">Shadow Roles</h2>
        <p className="text-sm font-bold text-[#5a554f]">
          One down-right light source. Depth changes by semantic elevation, not random direction.
        </p>
        <div className="grid gap-4 sm:grid-cols-5">
          {Object.entries(notebookShadowRoles).map(([role, shadow]) => (
            <div key={role} className={cn('rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] p-3 text-center uppercase', shadow)}>
              {role}
            </div>
          ))}
        </div>
      </div>
    </StoryPad>
  )
};
