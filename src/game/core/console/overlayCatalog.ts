import type { HobbyStationId } from './content/hobbiesSpots';
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

const HOBBIES: Record<HobbyStationId, OverlaySummary> = {
  art: {
    id: 'art',
    title: 'Drawing',
    blurb: 'An easel and a fresh sheet. Sign a doodle to pin it up on the street.'
  },
  music: {
    id: 'music',
    title: 'Guitar',
    blurb: 'Each letter plays the chord of that name. I, 9, and 0 pick the top strings. Strum G, D, Em, C, G to win a copper string.'
  },
  fitness: {
    id: 'fitness',
    title: 'Muay Thai',
    blurb: 'Strike the bag on the beat. Land the full combo for a battery cell.'
  },
  dancing: {
    id: 'dancing',
    title: 'Dancing',
    blurb: 'Repeat the moves on the beat. Reach round five for a clock crystal.'
  }
};

export function getHobbyOverlay(id: HobbyStationId): OverlaySummary {
  return HOBBIES[id];
}

export function getGamesOverlay(): OverlaySummary {
  return {
    id: 'games',
    title: 'Developer Console',
    blurb: 'Basement terminal — cheat scene jumps live here in the browser build.'
  };
}
