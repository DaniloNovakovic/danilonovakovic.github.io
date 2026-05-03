// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ModalShell } from './ModalShell';

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

interface TestModalProps {
  onClose?: () => void;
  title?: string;
}

function TestModal({ onClose = vi.fn(), title = 'Test Modal' }: TestModalProps) {
  return (
    <ModalShell title={title} hasDescription onClose={onClose}>
      {({ titleId, descriptionId }) => (
        <div>
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>Modal description.</p>
          <button>First button</button>
          <input aria-label="Text input" />
          <button>Last button</button>
        </div>
      )}
    </ModalShell>
  );
}

describe('ModalShell', () => {
  it('wires dialog ARIA to rendered title and description ids', () => {
    render(<TestModal />);

    const dialog = screen.getByRole('dialog', { name: 'Test Modal' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent).toBe('Test Modal');
    expect(document.getElementById(dialog.getAttribute('aria-describedby')!)?.textContent).toBe(
      'Modal description.'
    );
  });

  it('moves focus to the first focusable element', () => {
    render(<TestModal />);

    expect(document.activeElement).toBe(screen.getByRole('button', { name: /first button/i }));
  });

  it('wraps Tab and Shift+Tab within the dialog', async () => {
    render(<TestModal />);

    screen.getByRole('button', { name: /last button/i }).focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /first button/i }));

    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /last button/i }));
  });

  it('closes only the top modal on Escape', async () => {
    const firstOnClose = vi.fn();
    const secondOnClose = vi.fn();

    render(
      <>
        <TestModal title="First Modal" onClose={firstOnClose} />
        <TestModal title="Second Modal" onClose={secondOnClose} />
      </>
    );

    await userEvent.keyboard('{Escape}');

    expect(firstOnClose).not.toHaveBeenCalled();
    expect(secondOnClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click but not inside click', async () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /first button/i }));
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('returns focus to the opener when closed', async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open modal</button>
          {open && <TestModal onClose={() => setOpen(false)} />}
        </>
      );
    }

    render(<Harness />);
    const opener = screen.getByRole('button', { name: /open modal/i });
    await userEvent.click(opener);
    await userEvent.keyboard('{Escape}');

    expect(document.activeElement).toBe(opener);
  });

  it('locks body scroll while mounted and restores it after unmount', () => {
    const { unmount } = render(<TestModal />);

    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
