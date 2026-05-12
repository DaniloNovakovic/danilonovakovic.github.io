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
} from '.';

afterEach(cleanup);

describe('NotebookShell components', () => {
  it('marks the stage with the chosen scene profile and layout', () => {
    render(
      <NotebookShellStage
        profile="ruledBoardPage"
        layout="focus"
        data-testid="stage"
      >
        <NotebookPageFrame profile="ruledBoardPage">Board</NotebookPageFrame>
      </NotebookShellStage>
    );

    const stage = screen.getByTestId('stage');
    expect(stage.getAttribute('data-profile')).toBe('ruledBoardPage');
    expect(stage.getAttribute('data-layout')).toBe('focus');
    expect(stage.dataset.viewport).toBeUndefined();
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
        notes={<p>Quiet profile notes</p>}
        status={<SceneStatusSlip metric="Status" label="quiet state" variant="chip" />}
      >
        <div>Playable page</div>
      </NotebookSpread>
    );

    expect(screen.getByText('Quiet profile notes')).toBeDefined();
    expect(screen.getByText('Playable page')).toBeDefined();
    expect(screen.getByRole('meter')).toBeDefined();
  });

  it('supports auto, row, and stack panel action layouts', () => {
    const { rerender } = render(
      <ScenePanelSheet
        title="Choose Option"
        body="Pick one option."
        actionsLayout="auto"
        actions={[
          { label: 'Primary', variant: 'primary' },
          { label: 'Secondary', variant: 'secondary' }
        ]}
      />
    );

    const dialog = screen.getByRole('dialog', { name: 'Choose Option' });
    const actions = dialog.querySelector('div:last-child');
    expect(screen.getByRole('button', { name: 'Primary' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Secondary' })).toBeDefined();
    expect(actions?.getAttribute('data-actions-layout')).toBe('auto');
    expect(actions?.getAttribute('style')).toContain('auto-fit');

    rerender(
      <ScenePanelSheet
        title="Choose Option"
        body="Pick one option."
        actionsLayout="row"
        actions={[
          { label: 'Primary', variant: 'primary' },
          { label: 'Secondary', variant: 'secondary' }
        ]}
      />
    );

    expect(
      screen
        .getByRole('dialog', { name: 'Choose Option' })
        .querySelector('div:last-child')
        ?.className.split(' ')
    ).toContain('grid-cols-2');

    rerender(
      <ScenePanelSheet
        title="Choose Option"
        body="Pick one option."
        actionsLayout="stack"
        actions={[
          { label: 'Primary', variant: 'primary' },
          { label: 'Secondary', variant: 'secondary' }
        ]}
      />
    );

    expect(
      screen
        .getByRole('dialog', { name: 'Choose Option' })
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
        <SceneChoiceCard title="Choice A" description="Selected paper option." selected />
        <SceneChoiceCard title="Choice B" description="Unselected paper option." />
      </SceneChoiceGrid>
    );

    const selectedChoice = screen.getByRole('button', { name: /Choice A/ });
    expect(selectedChoice.getAttribute('aria-pressed')).toBe('true');
    expect(selectedChoice.className).toContain('ring-inset');
    expect(screen.getByRole('button', { name: /Choice B/ })).toBeDefined();
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
