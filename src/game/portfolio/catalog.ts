import type { FeatureCatalogEntry } from '@/game/registry/catalogTypes';
import { getMessages } from '@/shared/i18n';
import ProfileOverlay from './profile/ProfileOverlay';
import ExperienceOverlay from './experience/ExperienceOverlay';
import ProjectsOverlay from './projects/ProjectsOverlay';
import AbilitiesOverlay from './abilities/AbilitiesOverlay';
import ContactOverlay from './contact/ContactOverlay';

const messages = getMessages();

export const PORTFOLIO_FEATURE_CATALOG_ENTRIES: FeatureCatalogEntry[] = [
  {
    id: 'profile',
    name: messages.catalog.portfolio.profile.name,
    description: messages.catalog.portfolio.profile.description,
    runtime: {
      kind: 'reactOverlay',
      component: ProfileOverlay,
      loadComponent: async () => ({ default: ProfileOverlay })
    }
  },
  {
    id: 'experiences',
    name: messages.catalog.portfolio.experiences.name,
    description: messages.catalog.portfolio.experiences.description,
    runtime: {
      kind: 'reactOverlay',
      component: ExperienceOverlay,
      loadComponent: async () => ({ default: ExperienceOverlay })
    }
  },
  {
    id: 'projects',
    name: messages.catalog.portfolio.projects.name,
    description: messages.catalog.portfolio.projects.description,
    runtime: {
      kind: 'reactOverlay',
      component: ProjectsOverlay,
      loadComponent: async () => ({ default: ProjectsOverlay })
    }
  },
  {
    id: 'abilities',
    name: messages.catalog.portfolio.abilities.name,
    description: messages.catalog.portfolio.abilities.description,
    runtime: {
      kind: 'reactOverlay',
      component: AbilitiesOverlay,
      loadComponent: async () => ({ default: AbilitiesOverlay })
    }
  },
  {
    id: 'contact',
    name: messages.catalog.portfolio.contact.name,
    description: messages.catalog.portfolio.contact.description,
    runtime: {
      kind: 'reactOverlay',
      component: ContactOverlay,
      loadComponent: async () => ({ default: ContactOverlay })
    }
  }
];
