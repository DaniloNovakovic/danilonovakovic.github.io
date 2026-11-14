import { catalogMessages } from './catalog';
import { commonMessages } from './common';
import { gameShellMessages } from './gameShell';
import { inventoryMessages } from './inventory';
import { manualPageMessages } from './manualPage';
import { miniGameMessages } from './miniGames';
import { modePickerMessages } from './modePicker';
import { navigationMessages } from './navigation';
import { portfolioMessages } from './portfolio';
import { potassiumSlipMessages } from './potassiumSlip';
import { ridgeMessages } from './ridge';
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
  manualPage: manualPageMessages,
  portfolio: portfolioMessages,
  catalog: catalogMessages,
  scenes: sceneMessages,
  miniGames: miniGameMessages,
  potassiumSlip: potassiumSlipMessages,
  ridge: ridgeMessages,
  trailCard: trailCardMessages,
} as const;
