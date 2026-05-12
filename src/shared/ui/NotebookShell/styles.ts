import type { CSSProperties } from 'react';
import type {
  NotebookChoiceTone,
  NotebookPanelActionsLayout,
  NotebookPanelPlacement,
  NotebookSceneProfile,
  NotebookScrapTone,
  NotebookShellLayout
} from './types';

export const stageLayoutStyles: Record<NotebookShellLayout, CSSProperties> = {
  focus: {
    width: 'min(1180px, calc(100vw - 1rem))',
    height: '100dvh',
    minWidth: 'min(20rem, calc(100vw - 1rem))',
    minHeight: 'min(18rem, calc(100dvh - 1rem))'
  },
  spread: {
    width: 'min(1180px, calc(100vw - 1rem))',
    height: '100dvh',
    minWidth: 'min(20rem, calc(100vw - 1rem))',
    minHeight: 'min(18rem, calc(100dvh - 1rem))'
  }
};

export const profileBackgrounds: Record<NotebookSceneProfile, CSSProperties> = {
  sideViewPage: {
    background:
      'linear-gradient(90deg, rgba(202,55,55,0.16) 0 2px, transparent 2px 100%) 2.2rem 0 / 100% 100%, linear-gradient(rgba(26,26,26,0.08) 1px, transparent 1px) 0 3.4rem / 100% 3.5rem, #fbfbf9'
  },
  ruledBoardPage: {
    background:
      'linear-gradient(rgba(26,26,26,0.14) 2px, transparent 2px) 0 4.4rem / 100% 4.25rem, #fbfbf9'
  },
  survivalPage: {
    background: '#fbfbf9'
  }
};

export const notesBackground: CSSProperties = {
  background:
    'linear-gradient(90deg, rgba(202,55,55,0.16) 0 2px, transparent 2px 100%) 2.2rem 0 / 100% 100%, linear-gradient(rgba(26,26,26,0.08) 1px, transparent 1px) 0 3.4rem / 100% 3.5rem, #fbfbf9'
};

export const panelPlacementStyles: Record<NotebookPanelPlacement, CSSProperties> = {
  centered: {
    width: 'min(34rem, calc(100% - 1rem))',
    maxHeight: 'min(76dvh, 32rem)'
  },
  wide: {
    width: 'min(46rem, calc(100vw - 1rem))',
    maxHeight: 'min(82dvh, 36rem)'
  },
  mobileStacked: {
    width: 'min(23rem, calc(100% - 0.75rem))',
    maxHeight: 'calc(100% - 0.75rem)'
  }
};

export const actionGridStyles: Record<NotebookPanelActionsLayout, CSSProperties | undefined> = {
  auto: {
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(13rem, 100%), 1fr))'
  },
  row: undefined,
  stack: undefined
};

export const choiceToneClasses: Record<NotebookChoiceTone, string> = {
  ink: 'text-[#1a1a1a]',
  yellow: 'text-[#c7a51b]',
  blue: 'text-[#37aee7]',
  red: 'text-[#f05a5a]'
};

export const scrapToneClasses: Record<NotebookScrapTone, string> = {
  paper: 'bg-[#fbfbf9]',
  yellow: 'bg-[#d9c276]',
  blue: 'bg-[#b8d8f1]'
};
