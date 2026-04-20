// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OverlayCard } from './OverlayCard';

afterEach(cleanup);

async function renderCard(onClose = vi.fn()) {
  render(
    <OverlayCard title="Test Overlay" description="A description." onClose={onClose}>
      <button>First child button</button>
      <input placeholder="text input" />
      <button>Last child button</button>
    </OverlayCard>
  );
  // Let the initial-focus useEffect run
  await new Promise((r) => setTimeout(r, 0));
}

describe('OverlayCard', () => {
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
    it('moves focus to the first focusable element (close button)', async () => {
      await renderCard();
      const closeBtn = screen.getByRole('button', { name: /close/i });
      expect(document.activeElement).toBe(closeBtn);
    });
  });

  describe('Escape key', () => {
    it('calls onClose when Escape is pressed', async () => {
      const onClose = vi.fn();
      await renderCard(onClose);
      await userEvent.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('focus trap', () => {
    it('wraps Tab from last element back to close button', async () => {
      await renderCard();
      // Focus the last button manually
      const lastBtn = screen.getByRole('button', { name: /last child button/i });
      lastBtn.focus();
      await userEvent.tab();
      const closeBtn = screen.getByRole('button', { name: /close/i });
      expect(document.activeElement).toBe(closeBtn);
    });

    it('wraps Shift+Tab from close button to last element', async () => {
      await renderCard();
      const closeBtn = screen.getByRole('button', { name: /close/i });
      closeBtn.focus();
      await userEvent.tab({ shift: true });
      const lastBtn = screen.getByRole('button', { name: /last child button/i });
      expect(document.activeElement).toBe(lastBtn);
    });
  });
});
