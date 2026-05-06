import type { OverlayDefinition } from '@/game/overlays/types';
import { getMessages } from '@/shared/i18n';
import ProfileOverlay from './profile/ProfileOverlay';
import ExperienceOverlay from './experience/ExperienceOverlay';
import ProjectsOverlay from './projects/ProjectsOverlay';
import AbilitiesOverlay from './abilities/AbilitiesOverlay';
import ContactOverlay from './contact/ContactOverlay';

const messages = getMessages();

export const PORTFOLIO_OVERLAY_DEFINITIONS: readonly OverlayDefinition[] = [
  {
    id: 'profile',
    title: messages.catalog.portfolio.profile.name,
    description: messages.catalog.portfolio.profile.description,
    component: ProfileOverlay,
    loadComponent: async () => ({ default: ProfileOverlay }),
    includeInDevSwitcher: true
  },
  {
    id: 'experiences',
    title: messages.catalog.portfolio.experiences.name,
    description: messages.catalog.portfolio.experiences.description,
    component: ExperienceOverlay,
    loadComponent: async () => ({ default: ExperienceOverlay }),
    includeInDevSwitcher: true
  },
  {
    id: 'projects',
    title: messages.catalog.portfolio.projects.name,
    description: messages.catalog.portfolio.projects.description,
    component: ProjectsOverlay,
    loadComponent: async () => ({ default: ProjectsOverlay }),
    includeInDevSwitcher: true
  },
  {
    id: 'abilities',
    title: messages.catalog.portfolio.abilities.name,
    description: messages.catalog.portfolio.abilities.description,
    component: AbilitiesOverlay,
    loadComponent: async () => ({ default: AbilitiesOverlay }),
    includeInDevSwitcher: true
  },
  {
    id: 'contact',
    title: messages.catalog.portfolio.contact.name,
    description: messages.catalog.portfolio.contact.description,
    component: ContactOverlay,
    loadComponent: async () => ({ default: ContactOverlay }),
    includeInDevSwitcher: true
  }
];
