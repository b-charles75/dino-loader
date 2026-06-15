/**
 * Wrapper React mince pour <dino-loader>.
 *
 * Importer ce fichier enregistre le custom element (effet de bord de l'import
 * de ./dino-loader.js), puis expose un composant <DinoLoader /> avec des props
 * typées qui se mappent sur les attributs.
 *
 *   import { DinoLoader } from './dino-loader.react';
 *   <DinoLoader height={100} label="Chargement…" />
 */
import * as React from 'react';
import './dino-loader.js';

// Déclare la balise pour le JSX (sinon TS ne connaît pas <dino-loader>).
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
          dark?: boolean | string;
        },
        HTMLElement
      >;
    }
  }
}

export interface DinoLoaderProps {
  /** Hauteur de la scène en px (défaut 100). La scène est mise à l'échelle. */
  height?: number | string;
  /** Largeur logique de la piste en px (défaut 480, max 600). */
  width?: number | string;
  /** Multiplicateur de vitesse (défaut 1). */
  speed?: number;
  /** Légende optionnelle sous la scène. */
  label?: string;
  /** Inverse le dino (fond sombre). */
  dark?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function DinoLoader({ height, width, speed, label, dark, className, style }: DinoLoaderProps) {
  return (
    <dino-loader
      height={height}
      width={width}
      speed={speed}
      label={label}
      dark={dark ? '' : undefined}
      className={className}
      style={style}
    />
  );
}

export default DinoLoader;
