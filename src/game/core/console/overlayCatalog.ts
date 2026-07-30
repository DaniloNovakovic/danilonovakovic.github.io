import type { PortfolioOverlayId } from './content/overworldSpots';
import type { OverlaySummary } from './types';

const PORTFOLIO: Record<PortfolioOverlayId, OverlaySummary> = {
  profile: {
    id: 'profile',
    title: 'Profile',
    blurb: 'Sketchbook intro page — who Danilo is, in short strokes.'
  },
  experiences: {
    id: 'experiences',
    title: 'Experiences',
    blurb: 'Work history cards taped into the street gallery.'
  },
  projects: {
    id: 'projects',
    title: 'Projects',
    blurb: 'Selected builds and experiments pinned on the workshop wall.'
  },
  abilities: {
    id: 'abilities',
    title: 'Abilities',
    blurb: 'Skills sketched as ink stamps and margin notes.'
  },
  contact: {
    id: 'contact',
    title: 'Contact',
    blurb: 'How to reach out — the booth at the end of the street.'
  }
};

export function getPortfolioOverlay(id: PortfolioOverlayId): OverlaySummary {
  return PORTFOLIO[id];
}

export function getGamesOverlay(): OverlaySummary {
  return {
    id: 'games',
    title: 'Developer Console',
    blurb: 'Basement terminal — cheat scene jumps live here in the browser build.'
  };
}
