/**
 * Wrapper React mince pour <dino-loader>.
 *
 * Importer ce fichier enregistre le custom element (effet de bord de l'import
 * de ./dino-loader.js), puis expose un composant <DinoLoader /> avec des props
 * typées qui se mappent sur les attributs.
 *
 *   import { DinoLoader } from './dino-loader.react';
 *   <DinoLoader height={48} label="Chargement…" color="var(--accent)" />
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
          color?: string;
          speed?: number | string;
          label?: string;
        },
        HTMLElement
      >;
    }
  }
}

export interface DinoLoaderProps {
  /** Hauteur de la scène, px si nombre (défaut 48). */
  height?: number | string;
  /** Couleur du dino (défaut currentColor) ; accepte un hex, un nom, ou var(--x). */
  color?: string;
  /** Multiplicateur de vitesse (défaut 1). */
  speed?: number;
  /** Légende optionnelle sous la scène. */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function DinoLoader({ height, color, speed, label, className, style }: DinoLoaderProps) {
  return (
    <dino-loader
      height={height}
      color={color}
      speed={speed}
      label={label}
      className={className}
      style={style}
    />
  );
}

export default DinoLoader;
