import { describe, expect, it } from 'vitest';
import { createStampedeHudSnapshot } from './hudPresentation';
import {
  STAMPEDE_CONTACT_LIMIT,
  advanceStampedeSession,
  continueStampedeSessionEndless,
  createStampedeSession,
  resolveStampedeContact
} from './session';

describe('stampede hud presentation', () => {
  it('exposes readable HP from remaining contacts', () => {
    const contacted = resolveStampedeContact(createStampedeSession(), 1_000);

    expect(createStampedeHudSnapshot(contacted)).toMatchObject({
      contacts: 1,
      contactLimit: STAMPEDE_CONTACT_LIMIT,
      healthRemaining: STAMPEDE_CONTACT_LIMIT - 1
    });
  });

  it('counts up instead of down in endless mode', () => {
    const endless = continueStampedeSessionEndless(
      advanceStampedeSession(createStampedeSession({ durationMs: 1_000 }), 1_000)
    );
    const snapshot = createStampedeHudSnapshot(advanceStampedeSession(endless, 61_500));

    expect(snapshot.timerSeconds).toBe(62.5);
    expect(snapshot.timeRemainingSeconds).toBeUndefined();
    expect(snapshot.phaseLabel).toBe('Endless');
  });
});
