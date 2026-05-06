import { describe, expect, it } from 'vitest';
import { messages } from '@/shared/i18n';
import { TEXTS as SHARED_TEXTS } from '@/shared/content/content';
import { TEXTS as GAME_TEXTS } from '@/game/registry/content';
import { PORTFOLIO_TEXT } from '@/shared/content/portfolio/text';
import { HOBBIES_TEXT } from '@/game/scenes/hobbies';
import { BASEMENT_TEXT } from '@/game/scenes/basement';

describe('English message catalog', () => {
  it('backs the legacy shared and game text exports', () => {
    expect(SHARED_TEXTS.common.loading).toBe(messages.common.loading);
    expect(GAME_TEXTS.navigation.enter).toBe(messages.navigation.enter);
    expect(PORTFOLIO_TEXT.profile.title).toBe(messages.portfolio.profile.title);
    expect(HOBBIES_TEXT.miniGames.drawing.erase).toBe(messages.miniGames.drawing.erase);
    expect(BASEMENT_TEXT.miniGames.coding.welcome).toBe(messages.miniGames.coding.welcome);
  });

  it('formats dynamic game strings from typed catalog functions', () => {
    expect(messages.miniGames.coding.commandNotFound('dance')).toBe('Command not found: dance');
    expect(messages.miniGames.dancing.gameOverWithScore(4)).toBe('GAME OVER! SCORE: 4');
    expect(messages.potassiumSlip.hud.score(120)).toBe('Score 120');
    expect(messages.potassiumSlip.hud.lives(3)).toBe('Lives 3');
    expect(messages.potassiumSlip.hud.waveLabel(7, 'Shield Day')).toBe('W7 Shield Day');
    expect(messages.potassiumSlip.finalScore(9001)).toBe('Final Score: 9001');
  });

  it('formats Potassium leaderboard records', () => {
    const modeLabel = messages.potassiumSlip.leaderboard.modeLabel('endless', 'won');

    expect(modeLabel).toBe('endless');
    expect(messages.potassiumSlip.leaderboard.recordLine(1, 42, 12, modeLabel)).toBe('1. 42 • W12 • endless');
  });
});
