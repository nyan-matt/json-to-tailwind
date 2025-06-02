// Using CSS-vars for semantic theming, no component tokens needed
export const TYPE = {
  Primary: 'bg-accent-primary-default text-text-inverse icon-icon-inverse hover:bg-accent-primary-strong',
  Default: 'bg-accent-neutral-weakest text-text-default icon-icon-default hover:bg-accent-neutral-weaker',
  Subtle: 'bg-background-default border border-border-subtle text-text-default icon-icon-default hover:bg-background-secondary',
  Warning: 'bg-accent-warning-weaker border text-text-default icon-icon-default hover:bg-accent-warning-default',
  Danger: 'bg-accent-danger-default text-text-inverse icon-icon-inverse hover:bg-accent-danger-strong',
};

export const STATE = {
  Default: '',
  Disabled: 'opacity-50 cursor-not-allowed',
  Active: 'scale-95',
};

export const SIZE = {
  Small: 'text-[var(--font-size-xs)]',
  Default: 'text-text-sm',
  Large: 'text-[var(--font-size-md)]',
};
