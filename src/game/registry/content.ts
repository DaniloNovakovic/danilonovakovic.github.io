import { TEXTS as SHARED_TEXTS } from '@shared/content/content';
import { PORTFOLIO_TEXT } from '@shared/content/portfolio/text';
import { BASEMENT_TEXT } from '@game/scenes/basement';
import { HOBBIES_TEXT } from '@game/scenes/hobbies';

export const TEXTS = {
  ...SHARED_TEXTS,
  profile: PORTFOLIO_TEXT.profile,
  abilities: PORTFOLIO_TEXT.abilities,
  projects: PORTFOLIO_TEXT.projects,
  hobbies: HOBBIES_TEXT.labels,
  contact: PORTFOLIO_TEXT.contact,
  miniGames: {
    ...SHARED_TEXTS.miniGames,
    coding: BASEMENT_TEXT.miniGames.coding,
    muayThai: HOBBIES_TEXT.miniGames.muayThai,
    guitar: HOBBIES_TEXT.miniGames.guitar,
    drawing: HOBBIES_TEXT.miniGames.drawing,
    dancing: HOBBIES_TEXT.miniGames.dancing,
  },
};
