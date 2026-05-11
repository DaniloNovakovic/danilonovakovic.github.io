// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import {
  ControlMat,
  NotebookHeaderChrome,
  NotebookPageFrame,
  NotebookShellStage,
  NotebookSpread,
  ScenePanelSheet,
  SceneStatusSlip
} from './NotebookShell';

afterEach(cleanup);

describe('NotebookShell components', () => {
  it('marks the stage with the chosen scene profile, layout, and viewport', () => {
    render(
      <NotebookShellStage
        profile="ruledBoardPage"
        layout="focus"
        viewport="desktopFocus"
        data-testid="stage"
      >
        <NotebookPageFrame profile="ruledBoardPage">Board</NotebookPageFrame>
      </NotebookShellStage>
    );

    const stage = screen.getByTestId('stage');
    expect(stage.getAttribute('data-profile')).toBe('ruledBoardPage');
    expect(stage.getAttribute('data-layout')).toBe('focus');
    expect(stage.getAttribute('data-viewport')).toBe('desktopFocus');
  });

  it('renders header Back and Menu controls as reachable buttons', () => {
    render(<NotebookHeaderChrome backLabel="Back" menuLabel="Menu" />);

    expect(screen.getByRole('button', { name: 'Back' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Menu' })).toBeDefined();
  });

  it('renders a spread with a notes page and playable page', () => {
    render(
      <NotebookSpread
        profile="sideViewPage"
        notes={<p>Quiet Ridge notes</p>}
        status={<SceneStatusSlip metric="Trail" label="quiet route" variant="chip" />}
      >
        <div>Playable Ridge</div>
      </NotebookSpread>
    );

    expect(screen.getByText('Quiet Ridge notes')).toBeDefined();
    expect(screen.getByText('Playable Ridge')).toBeDefined();
    expect(screen.getByRole('meter')).toBeDefined();
  });

  it('keeps mobile panel actions stacked and present', () => {
    render(
      <ScenePanelSheet
        title="Choose Banana Nonsense"
        body="Pick one upgrade."
        placement="mobileStacked"
        actions={[
          { label: 'Duplicate', variant: 'primary' },
          { label: 'Fire Trail', variant: 'secondary' }
        ]}
      />
    );

    const dialog = screen.getByRole('dialog', { name: 'Choose Banana Nonsense' });
    const actions = dialog.querySelector('div:last-child');
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Fire Trail' })).toBeDefined();
    expect(actions?.className.split(' ')).toContain('grid-cols-1');
  });

  it('labels the control mat as the larger shell input surface', () => {
    render(<ControlMat label="drag mat wider than board">Playfield</ControlMat>);

    expect(screen.getByText('drag mat wider than board')).toBeDefined();
    expect(screen.getByText('Playfield')).toBeDefined();
  });
});
