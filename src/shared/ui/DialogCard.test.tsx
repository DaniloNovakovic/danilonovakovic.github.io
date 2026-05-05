// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DialogCard } from './DialogCard';
import { ModalShell } from './ModalShell';

afterEach(cleanup);

async function renderCard(onClose = vi.fn()) {
  render(
    <ModalShell title="Test Overlay" hasDescription onClose={onClose}>
      {({ titleId, descriptionId }) => (
        <DialogCard
          title="Test Overlay"
          description="A description."
          onClose={onClose}
          titleId={titleId}
          descriptionId={descriptionId}
        >
          <button>First child button</button>
          <input placeholder="text input" />
          <button>Last child button</button>
        </DialogCard>
      )}
    </ModalShell>
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('DialogCard inside ModalShell', () => {
  describe('aria attributes', () => {
    it('has role="dialog"', async () => {
      await renderCard();
      expect(screen.getByRole('dialog')).toBeDefined();
    });

    it('has aria-modal="true"', async () => {
      await renderCard();
      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('aria-labelledby points to the title heading', async () => {
      await renderCard();
      const dialog = screen.getByRole('dialog');
      const labelId = dialog.getAttribute('aria-labelledby');
      expect(labelId).toBeTruthy();
      const heading = document.getElementById(labelId!);
      expect(heading?.textContent).toBe('Test Overlay');
    });
  });

  describe('initial focus', () => {
    it('moves focus to the first focusable element', async () => {
      await renderCard();
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(document.activeElement).toBe(closeButton);
    });
  });

  describe('Escape key', () => {
    it('calls onClose when Escape is pressed', async () => {
      const onClose = vi.fn();
      await renderCard(onClose);
      await userEvent.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('only closes the top-most dialog when multiple dialogs are mounted', async () => {
      const firstOnClose = vi.fn();
      const secondOnClose = vi.fn();

      render(
        <>
          <ModalShell title="First Overlay" onClose={firstOnClose}>
            {({ titleId }) => (
              <DialogCard title="First Overlay" onClose={firstOnClose} titleId={titleId}>
                <button>First dialog button</button>
              </DialogCard>
            )}
          </ModalShell>
          <ModalShell title="Second Overlay" onClose={secondOnClose}>
            {({ titleId }) => (
              <DialogCard title="Second Overlay" onClose={secondOnClose} titleId={titleId}>
                <button>Second dialog button</button>
              </DialogCard>
            )}
          </ModalShell>
        </>
      );
      await new Promise((resolve) => setTimeout(resolve, 0));

      await userEvent.keyboard('{Escape}');

      expect(firstOnClose).not.toHaveBeenCalled();
      expect(secondOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('focus trap', () => {
    it('wraps Tab from last element back to close button', async () => {
      await renderCard();
      const lastButton = screen.getByRole('button', { name: /last child button/i });
      lastButton.focus();
      await userEvent.tab();
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(document.activeElement).toBe(closeButton);
    });

    it('wraps Shift+Tab from close button to last element', async () => {
      await renderCard();
      const closeButton = screen.getByRole('button', { name: /close/i });
      closeButton.focus();
      await userEvent.tab({ shift: true });
      const lastButton = screen.getByRole('button', { name: /last child button/i });
      expect(document.activeElement).toBe(lastButton);
    });
  });
});
