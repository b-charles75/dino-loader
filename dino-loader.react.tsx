/**
 * Thin React wrapper for <dino-loader>.
 *
 * Importing this file registers the custom element (side effect of importing
 * ./dino-loader.js), then exposes a <DinoLoader /> component with typed props
 * that map onto the attributes.
 *
 *   import { DinoLoader } from './dino-loader.react';
 *   <DinoLoader height={100} label="Loading…" />
 */
import * as React from 'react';
import './dino-loader.js';

// Declare the tag for JSX (otherwise TS does not know about <dino-loader>).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'dino-loader': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          height?: number | string;
          width?: number | string;
          speed?: number | string;
          label?: string;
          color?: string;
          dark?: boolean | string;
        },
        HTMLElement
      >;
    }
  }
}

export interface DinoLoaderProps {
  /** Scene height in px (default 100). The whole scene is scaled. */
  height?: number | string;
  /** Logical track width in px (default 480, max 600). */
  width?: number | string;
  /** Speed multiplier (default 1). */
  speed?: number;
  /** Optional caption under the scene. */
  label?: string;
  /** Recolor the whole game. CSS color or var(--x). Default: original gray. */
  color?: string;
  /** Invert the dino (dark background). */
  dark?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function DinoLoader({ height, width, speed, label, color, dark, className, style }: DinoLoaderProps) {
  return (
    <dino-loader
      height={height}
      width={width}
      speed={speed}
      label={label}
      color={color}
      dark={dark ? '' : undefined}
      className={className}
      style={style}
    />
  );
}

export default DinoLoader;
