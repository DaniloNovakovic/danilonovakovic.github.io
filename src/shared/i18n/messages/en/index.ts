import { catalogMessages } from './catalog';
import { commonMessages } from './common';
import { gameShellMessages } from './gameShell';
import { inventoryMessages } from './inventory';
import { miniGameMessages } from './miniGames';
import { modePickerMessages } from './modePicker';
import { navigationMessages } from './navigation';
import { portfolioMessages } from './portfolio';
import { potassiumSlipMessages } from './potassiumSlip';
import { sceneMessages } from './scenes';
import { staticPortfolioMessages } from './staticPortfolio';
import { trailCardMessages } from './trailCard';

export const enMessages = {
  common: commonMessages,
  navigation: navigationMessages,
  modePicker: modePickerMessages,
  staticPortfolio: staticPortfolioMessages,
  gameShell: gameShellMessages,
  inventory: inventoryMessages,
  portfolio: portfolioMessages,
  catalog: catalogMessages,
  scenes: sceneMessages,
  miniGames: miniGameMessages,
  potassiumSlip: potassiumSlipMessages,
  trailCard: trailCardMessages,
} as const;
