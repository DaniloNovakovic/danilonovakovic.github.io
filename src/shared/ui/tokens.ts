export const sketchColors = {
  ink: '#1a1a1a',
  paper: '#fbfbf9',
  paperMuted: '#f4f1ea',
  paperHover: '#e8e5df'
} as const;

export const sketchShadows = {
  xs: 'shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]',
  sm: 'shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]',
  md: 'shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]',
  lg: 'shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]',
  xl: 'shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]'
} as const;

export const notebookShadowRoles = {
  /** Active or selected controls that should feel nearly flush. */
  pressed: sketchShadows.xs,
  /** Buttons, tabs, chips, scraps, and compact status UI. */
  control: sketchShadows.sm,
  /** Blocking panels, loose sheets, menus, and elevated overlays. */
  sheet: sketchShadows.md,
  /** Primary page or board frames above the notebook paper. */
  page: sketchShadows.lg,
  /** Quiet base notebook surface behind shell chrome. */
  stage: 'shadow-none'
} as const;

export const sketchBorders = {
  thin: 'border border-[#1a1a1a]',
  medium: 'border-2 border-[#1a1a1a]',
  thick: 'border-4 border-[#1a1a1a]'
} as const;

export const sketchFocusVisible =
  'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] focus-visible:ring-2 focus-visible:ring-[#fbfbf9]';
