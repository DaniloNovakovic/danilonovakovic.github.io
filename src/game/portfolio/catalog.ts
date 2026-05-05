import type { FeatureCatalogEntry } from '@/game/registry/catalogTypes';
import ProfileOverlay from './profile/ProfileOverlay';
import ExperienceOverlay from './experience/ExperienceOverlay';
import ProjectsOverlay from './projects/ProjectsOverlay';
import AbilitiesOverlay from './abilities/AbilitiesOverlay';
import ContactOverlay from './contact/ContactOverlay';

export const PORTFOLIO_FEATURE_CATALOG_ENTRIES: FeatureCatalogEntry[] = [
  {
    id: 'profile',
    name: 'Profile',
    description: 'About me, my background and location.',
    runtime: {
      kind: 'reactOverlay',
      component: ProfileOverlay,
      loadComponent: async () => ({ default: ProfileOverlay })
    }
  },
  {
    id: 'experiences',
    name: 'Experiences',
    description: 'My career path and education.',
    runtime: {
      kind: 'reactOverlay',
      component: ExperienceOverlay,
      loadComponent: async () => ({ default: ExperienceOverlay })
    }
  },
  {
    id: 'projects',
    name: 'Projects',
    description: 'Showcase of my personal and professional projects.',
    runtime: {
      kind: 'reactOverlay',
      component: ProjectsOverlay,
      loadComponent: async () => ({ default: ProjectsOverlay })
    }
  },
  {
    id: 'abilities',
    name: 'Abilities',
    description: 'Technical skills, languages and tools.',
    runtime: {
      kind: 'reactOverlay',
      component: AbilitiesOverlay,
      loadComponent: async () => ({ default: AbilitiesOverlay })
    }
  },
  {
    id: 'contact',
    name: 'Contact',
    description: 'Get in touch with me.',
    runtime: {
      kind: 'reactOverlay',
      component: ContactOverlay,
      loadComponent: async () => ({ default: ContactOverlay })
    }
  }
];
