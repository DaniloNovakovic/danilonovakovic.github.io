import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  ReactNode
} from 'react';
import { ArrowLeft, Menu } from 'lucide-react';
import { Button } from '../Button';
import { notebookShadowRoles } from '../tokens';
import { cn } from '../utils';

export type NotebookSceneProfile = 'sideViewPage' | 'ruledBoardPage' | 'survivalPage';
export type NotebookShellLayout = 'focus' | 'spread';
export type NotebookViewport =
  | 'desktopFocus'
  | 'desktopSpread'
  | 'phonePortrait'
  | 'phoneLandscape'
  | 'tablet'
  | 'tabletLandscape';
export type NotebookPanelPlacement = 'centered' | 'wide' | 'mobileStacked';

interface NotebookShellStageProps extends HTMLAttributes<HTMLDivElement> {
  profile: NotebookSceneProfile;
  layout?: NotebookShellLayout;
  viewport?: NotebookViewport;
  header?: ReactNode;
  panel?: ReactNode;
  footer?: ReactNode;
}

interface NotebookHeaderChromeProps extends HTMLAttributes<HTMLElement> {
  backLabel?: string;
  backAriaLabel?: string;
  menuLabel?: string;
  menuAriaLabel?: string;
  showMenu?: boolean;
  onBack?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  onMenu?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}

interface ControlMatProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  showGuide?: boolean;
}

interface NotebookPageFrameProps extends HTMLAttributes<HTMLElement> {
  profile: NotebookSceneProfile;
  kind?: 'game' | 'notes';
  status?: ReactNode;
}

interface NotebookSpreadProps extends HTMLAttributes<HTMLDivElement> {
  profile: NotebookSceneProfile;
  notes: ReactNode;
  status?: ReactNode;
}

interface ScenePanelSheetAction {
  label: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

interface ScenePanelSheetProps extends HTMLAttributes<HTMLElement> {
  title: string;
  body: ReactNode;
  actions: readonly ScenePanelSheetAction[];
  placement?: NotebookPanelPlacement;
}

interface SceneStatusSlipProps extends HTMLAttributes<HTMLDivElement> {
  metric: string;
  label: string;
  detail?: string;
  meterValue?: number;
  variant?: 'footer' | 'chip';
}

const stageViewportStyles: Record<NotebookViewport, CSSProperties> = {
  desktopFocus: {
    width: 'min(1180px, calc(100vw - 2rem))',
    height: 'min(760px, calc(100dvh - 9rem))',
    minHeight: '20rem'
  },
  desktopSpread: {
    width: 'min(1180px, calc(100vw - 2rem))',
    height: 'min(760px, calc(100dvh - 9rem))',
    minHeight: '20rem'
  },
  phonePortrait: {
    width: 'min(390px, calc(100vw - 2rem))',
    height: 'min(780px, calc(100dvh - 4rem))',
    minHeight: '38rem'
  },
  phoneLandscape: {
    width: 'min(790px, calc(100vw - 2rem))',
    height: 'min(360px, calc(100dvh - 3.2rem))',
    minHeight: '18rem'
  },
  tablet: {
    width: 'min(820px, calc(100vw - 2rem))',
    height: 'min(980px, calc(100dvh - 4rem))',
    minHeight: '42rem'
  },
  tabletLandscape: {
    width: 'min(1024px, calc(100vw - 2rem))',
    height: 'min(720px, calc(100dvh - 4rem))',
    minHeight: '34rem'
  }
};

const profileBackgrounds: Record<NotebookSceneProfile, CSSProperties> = {
  sideViewPage: {
    background:
      'linear-gradient(90deg, rgba(202,55,55,0.16) 0 2px, transparent 2px 100%) 2.2rem 0 / 100% 100%, linear-gradient(rgba(26,26,26,0.08) 1px, transparent 1px) 0 3.4rem / 100% 3.5rem, #fbfbf9'
  },
  ruledBoardPage: {
    background:
      'linear-gradient(rgba(26,26,26,0.14) 2px, transparent 2px) 0 4.4rem / 100% 4.25rem, #fbfbf9'
  },
  survivalPage: {
    background: '#fbfbf9'
  }
};

const notesBackground: CSSProperties = {
  background:
    'linear-gradient(90deg, rgba(202,55,55,0.16) 0 2px, transparent 2px 100%) 2.2rem 0 / 100% 100%, linear-gradient(rgba(26,26,26,0.08) 1px, transparent 1px) 0 3.4rem / 100% 3.5rem, #fbfbf9'
};

const panelPlacementStyles: Record<NotebookPanelPlacement, CSSProperties> = {
  centered: {
    width: 'min(34rem, calc(100% - 1rem))',
    maxHeight: 'min(76dvh, 32rem)'
  },
  wide: {
    width: 'min(46rem, calc(100vw - 1rem))',
    maxHeight: 'min(82dvh, 36rem)'
  },
  mobileStacked: {
    width: 'min(23rem, calc(100% - 0.75rem))',
    maxHeight: 'calc(100% - 0.75rem)'
  }
};

export function NotebookShellStage({
  profile,
  layout = 'focus',
  viewport = layout === 'spread' ? 'desktopSpread' : 'desktopFocus',
  header,
  panel,
  footer,
  children,
  className,
  style,
  ...props
}: NotebookShellStageProps) {
  return (
    <div
      data-profile={profile}
      data-layout={layout}
      data-viewport={viewport}
      className={cn(
        'relative overflow-hidden rounded-br-[1.75rem] border-4 border-[#1a1a1a] bg-[#f4f1ea] text-[#1a1a1a]',
        'font-[var(--font-ui)]',
        notebookShadowRoles.stage,
        className
      )}
      style={{
        background:
          'linear-gradient(rgba(26,26,26,0.025) 1px, transparent 1px) 0 0 / 100% 2.5rem, #f4f1ea',
        ...stageViewportStyles[viewport],
        ...style
      }}
      {...props}
    >
      {header}
      {children}
      {panel}
      {footer ? <div className="absolute inset-x-3 bottom-3 z-20 flex justify-center">{footer}</div> : null}
    </div>
  );
}

export function NotebookHeaderChrome({
  backLabel = 'Back',
  backAriaLabel,
  menuLabel = 'Menu',
  menuAriaLabel,
  showMenu = true,
  onBack,
  onMenu,
  className,
  ...props
}: NotebookHeaderChromeProps) {
  return (
    <nav
      aria-label="Notebook scene controls"
      className={cn(
        'pointer-events-none absolute left-4 right-4 top-3 z-40 flex items-center justify-between gap-3',
        className
      )}
      {...props}
    >
      <Button
        aria-label={backAriaLabel ?? backLabel}
        className="pointer-events-auto min-h-11 px-3 font-mono text-sm uppercase tracking-widest"
        icon={<ArrowLeft className="h-4 w-4" aria-hidden />}
        onClick={onBack}
        size="sm"
        variant="floating"
      >
        {backLabel}
      </Button>
      {showMenu ? (
        <Button
          aria-label={menuAriaLabel ?? menuLabel}
          className="pointer-events-auto min-h-11 bg-[#b8d8f1] px-3 font-mono text-sm uppercase tracking-widest"
          icon={<Menu className="h-4 w-4" aria-hidden />}
          onClick={onMenu}
          size="sm"
          variant="floating"
        >
          {menuLabel}
        </Button>
      ) : null}
    </nav>
  );
}

export function ControlMat({
  label = 'shell-level control mat',
  showGuide = true,
  children,
  className,
  ...props
}: ControlMatProps) {
  return (
    <div
      className={cn(
        'absolute inset-x-3 bottom-3 top-16 rounded-[1.375rem] bg-[#fbfbf9]/20 outline outline-2 -outline-offset-8 outline-[#1a1a1a]/10',
        className
      )}
      {...props}
    >
      {children}
      {showGuide ? (
        <span className="pointer-events-none absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-widest text-[#1a1a1a]/45">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function NotebookPageFrame({
  profile,
  kind = 'game',
  status,
  children,
  className,
  style,
  ...props
}: NotebookPageFrameProps) {
  const Component = kind === 'notes' ? 'aside' : 'section';
  return (
    <Component
      className={cn(
        'relative min-h-0 min-w-0 overflow-hidden border-4 border-[#1a1a1a] bg-[#fbfbf9]',
        kind === 'notes' ? 'rounded-l-2xl border-r-2 p-5 pt-14' : 'rounded-2xl',
        className
      )}
      style={{ ...(kind === 'notes' ? notesBackground : profileBackgrounds[profile]), ...style }}
      {...props}
    >
      {status}
      {children}
    </Component>
  );
}

export function NotebookSpread({
  profile,
  notes,
  status,
  children,
  className,
  ...props
}: NotebookSpreadProps) {
  return (
    <div
      className={cn(
        'absolute inset-x-4 bottom-4 top-16 grid grid-cols-[minmax(12rem,0.76fr)_minmax(0,1.36fr)]',
        notebookShadowRoles.page,
        className
      )}
      {...props}
    >
      <NotebookPageFrame profile={profile} kind="notes">
        {notes}
      </NotebookPageFrame>
      <NotebookPageFrame
        profile={profile}
        className="rounded-l-none border-l-2"
        status={status}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 top-0 z-10 -ml-1 w-2 bg-[linear-gradient(90deg,rgba(26,26,26,0.22),rgba(26,26,26,0.04),rgba(26,26,26,0.18))]"
        />
        {children}
      </NotebookPageFrame>
    </div>
  );
}

export function ScenePanelSheet({
  title,
  body,
  actions,
  placement = 'centered',
  className,
  style,
  ...props
}: ScenePanelSheetProps) {
  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-label={title}
      className={cn(
        'absolute left-1/2 top-1/2 z-30 grid -translate-x-1/2 -translate-y-1/2 rotate-[-0.4deg] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden rounded-lg border-4 border-[#1a1a1a] bg-[#fbfbf9]/95 p-4 text-center',
        notebookShadowRoles.sheet,
        className
      )}
      style={{ ...panelPlacementStyles[placement], ...style }}
      {...props}
    >
      <h2 className="font-mono text-3xl font-black uppercase leading-none tracking-wider text-[#1a1a1a]">
        {title}
      </h2>
      <div className="min-h-0 overflow-y-auto font-mono text-sm font-bold leading-relaxed text-[#5a554f]">
        {body}
      </div>
      <div className={cn('grid gap-3', placement === 'mobileStacked' ? 'grid-cols-1' : 'grid-cols-2')}>
        {actions.map((action) => (
          <Button
            key={action.label}
            disabled={action.disabled}
            onClick={action.onClick}
            size="lg"
            variant={action.variant === 'primary' ? 'primary' : 'secondary'}
            className="min-h-12 w-full font-mono uppercase tracking-widest"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </section>
  );
}

export function SceneStatusSlip({
  metric,
  label,
  detail,
  meterValue = 0,
  variant = 'footer',
  className,
  ...props
}: SceneStatusSlipProps) {
  const meterWidth = `${Math.max(0, Math.min(100, meterValue))}%`;
  return (
    <div
      className={cn(
        'grid items-center gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9]/90 px-3 py-2 font-mono uppercase tracking-widest text-[#1a1a1a]',
        notebookShadowRoles.control,
        variant === 'chip'
          ? 'w-fit min-w-32 rounded-md text-left text-xs'
          : 'w-[min(38rem,100%)] grid-cols-[auto_minmax(0,1fr)_auto] rounded-xl text-center text-xs',
        className
      )}
      {...props}
    >
      <strong className="text-xl leading-none">{metric}</strong>
      <span className="min-w-0 truncate font-bold text-[#5a554f]">{label}</span>
      <span
        aria-label={`Meter ${Math.round(Math.max(0, Math.min(100, meterValue)))} percent`}
        className="h-3 w-20 border-2 border-[#1a1a1a] bg-[#fbfbf9] p-0.5"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.max(0, Math.min(100, meterValue)))}
      >
        <span className="block h-full bg-[#1a1a1a]/75" style={{ width: meterWidth }} />
      </span>
      {detail ? <span className="col-span-full text-[10px] text-[#5a554f]">{detail}</span> : null}
    </div>
  );
}
