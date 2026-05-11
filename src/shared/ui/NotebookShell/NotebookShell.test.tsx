// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import {
  ControlMat,
  NotebookMenuSheet,
  NotebookHeaderChrome,
  NotebookPageFrame,
  NotebookScrapNote,
  NotebookShellStage,
  NotebookSpread,
  SceneChoiceCard,
  SceneChoiceGrid,
  SceneHintSlip,
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

  it('reserves footer space by default and can opt into floating footers', () => {
    const { rerender } = render(
      <NotebookShellStage
        profile="survivalPage"
        footer={<SceneHintSlip label="Tap anywhere" />}
        data-testid="stage"
      />
    );

    expect(screen.getByTestId('stage').getAttribute('data-footer-mode')).toBe('reserved');

    rerender(
      <NotebookShellStage
        profile="survivalPage"
        footerMode="floating"
        footer={<SceneHintSlip label="Tap anywhere" />}
        data-testid="stage"
      />
    );

    expect(screen.getByTestId('stage').getAttribute('data-footer-mode')).toBe('floating');
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

  it('supports auto, row, and stack panel action layouts', () => {
    const { rerender } = render(
      <ScenePanelSheet
        title="Choose Banana Nonsense"
        body="Pick one upgrade."
        actionsLayout="auto"
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
    expect(actions?.getAttribute('data-actions-layout')).toBe('auto');
    expect(actions?.getAttribute('style')).toContain('auto-fit');

    rerender(
      <ScenePanelSheet
        title="Choose Banana Nonsense"
        body="Pick one upgrade."
        actionsLayout="row"
        actions={[
          { label: 'Duplicate', variant: 'primary' },
          { label: 'Fire Trail', variant: 'secondary' }
        ]}
      />
    );

    expect(
      screen
        .getByRole('dialog', { name: 'Choose Banana Nonsense' })
        .querySelector('div:last-child')
        ?.className.split(' ')
    ).toContain('grid-cols-2');

    rerender(
      <ScenePanelSheet
        title="Choose Banana Nonsense"
        body="Pick one upgrade."
        actionsLayout="stack"
        actions={[
          { label: 'Duplicate', variant: 'primary' },
          { label: 'Fire Trail', variant: 'secondary' }
        ]}
      />
    );

    expect(
      screen
        .getByRole('dialog', { name: 'Choose Banana Nonsense' })
        .querySelector('div:last-child')
        ?.className.split(' ')
    ).toContain('grid-cols-1');
  });

  it('renders hint slips without duplicating live meters', () => {
    render(<SceneHintSlip label="Drag toward a target" detail="Hold to recall" />);

    expect(screen.getByText('Drag toward a target')).toBeDefined();
    expect(screen.getByText('Hold to recall')).toBeDefined();
    expect(screen.queryByRole('meter')).toBeNull();
  });

  it('renders selectable scene choice cards inside a choice grid', () => {
    render(
      <SceneChoiceGrid columns="stack">
        <SceneChoiceCard title="Duplicate" description="Main hits spawn 2 small bananas." selected />
        <SceneChoiceCard title="Fire Trail" description="Moving bananas leave fire." />
      </SceneChoiceGrid>
    );

    expect(screen.getByRole('button', { name: /Duplicate/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /Fire Trail/ })).toBeDefined();
  });

  it('renders content-bearing notebook notes and menu sheets', () => {
    render(
      <>
        <NotebookScrapNote>Static mode hides in menu</NotebookScrapNote>
        <NotebookMenuSheet
          title="Menu"
          items={[
            { label: 'Static Mode', detail: 'Leave interactive view' },
            { label: 'Inventory', detail: 'Pocket notes' }
          ]}
        />
      </>
    );

    expect(screen.getByText('Static mode hides in menu')).toBeDefined();
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeDefined();
    expect(screen.getByRole('button', { name: /Static Mode/ })).toBeDefined();
  });

  it('labels the control mat as the larger shell input surface', () => {
    render(<ControlMat label="drag mat wider than board">Playfield</ControlMat>);

    expect(screen.getByText('drag mat wider than board')).toBeDefined();
    expect(screen.getByText('Playfield')).toBeDefined();
  });
});
