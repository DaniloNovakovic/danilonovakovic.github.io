// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import { OverlayHost } from './OverlayHost';

const overlayRenderSpy = vi.hoisted(() => vi.fn());

vi.mock('./overlayRegistry', async () => {
  const React = await import('react');
  const { DialogCard } = await import('@/shared/ui');

  return {
    getOverlayDefinition: (id: string) => ({
      id,
      component: ({
        params,
        close,
        enterScene,
        titleId,
        descriptionId
      }: {
        params?: unknown;
        close: () => void;
        enterScene: (sceneId: string) => void;
        titleId: string;
        descriptionId: string;
      }) => {
        overlayRenderSpy(params);
        return React.createElement(
          DialogCard,
          {
            title: `Mock ${id}`,
            description: 'Mock description',
            onClose: close,
            titleId,
            descriptionId,
            children: React.createElement(
              React.Fragment,
              null,
              React.createElement('button', { onClick: close }, 'Child close'),
              React.createElement('button', { onClick: () => enterScene('ridge') }, 'Child enter')
            )
          }
        );
      }
    })
  };
});

function resetBridge() {
  bridgeActions.returnToOverworld();
  bridgeActions.closeOverlay();
  bridgeActions.setSceneLoading(null);
  bridgeActions.resetTouch();
}

afterEach(() => {
  cleanup();
  resetBridge();
  overlayRenderSpy.mockClear();
  document.body.style.overflow = '';
});

describe('OverlayHost', () => {
  it('loads the active overlay and passes controller props', async () => {
    const params = { message: 'hello' };
    bridgeActions.openOverlay('profile', { params });

    render(<OverlayHost />);

    expect(await screen.findByRole('dialog', { name: /mock profile/i })).toBeDefined();
    expect(overlayRenderSpy).toHaveBeenCalledWith(params);

    await userEvent.click(screen.getByRole('button', { name: /child close/i }));
    await waitFor(() => expect(bridgeStore.getState().activeOverlay).toBeNull());
  });

  it('passes injected scene entry to active overlays', async () => {
    const enterScene = vi.fn();
    bridgeActions.openOverlay('profile');

    render(<OverlayHost enterScene={enterScene} />);

    expect(await screen.findByRole('dialog', { name: /mock profile/i })).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: /child enter/i }));

    expect(enterScene).toHaveBeenCalledWith('ridge');
  });

  it('closes on Escape by default', async () => {
    bridgeActions.openOverlay('profile');
    render(<OverlayHost />);

    expect(await screen.findByRole('dialog', { name: /mock profile/i })).toBeDefined();
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(bridgeStore.getState().activeOverlay).toBeNull());
  });

  it('does not close on Escape when the request disables it', async () => {
    bridgeActions.openOverlay('profile', { closeOnEscape: false });
    render(<OverlayHost />);

    expect(await screen.findByRole('dialog', { name: /mock profile/i })).toBeDefined();
    await userEvent.keyboard('{Escape}');

    expect(bridgeStore.getState().activeOverlayId).toBe('profile');
  });

  it('closes on backdrop click by default', async () => {
    bridgeActions.openOverlay('profile');
    render(<OverlayHost />);

    const dialog = await screen.findByRole('dialog', { name: /mock profile/i });
    await userEvent.click(dialog.parentElement!);

    await waitFor(() => expect(bridgeStore.getState().activeOverlay).toBeNull());
  });

  it('does not close on backdrop click when the request disables it', async () => {
    bridgeActions.openOverlay('profile', { closeOnBackdrop: false });
    render(<OverlayHost />);

    const dialog = await screen.findByRole('dialog', { name: /mock profile/i });
    await userEvent.click(dialog.parentElement!);

    expect(bridgeStore.getState().activeOverlayId).toBe('profile');
  });
});
