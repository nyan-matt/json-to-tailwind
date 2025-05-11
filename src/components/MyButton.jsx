import React from 'react';
import clsx from 'clsx';
import { TYPE, STATE, SIZE } from './buttonStyles';

export default function MyButton({
  type = 'Primary',
  state = 'Default',
  size = 'Default',
  leftIcon,
  rightIcon,
  label,
  showLeftIcon = false,
  showRightIcon = false,
  ...rest
}) {
  const classes = clsx(
    'rounded transition flex items-center justify-center gap-2',
    TYPE[type],
    SIZE[size],
    STATE[state],
    leftIcon && 'pl-3',
    rightIcon && 'pr-3'
  );

  return (
    <button
      className={classes}
      disabled={state === 'Disabled'}
      {...rest}
    >
      {showLeftIcon && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {label}
      {showRightIcon && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}
