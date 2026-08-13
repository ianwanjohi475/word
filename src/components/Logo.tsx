/** Converta brand mark — a gradient rounded badge with a document + convert arrows. */
import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';

export function Logo({ size = 44, radius = 13 }: { size?: number; radius?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#16B98C" />
          <Stop offset="1" stopColor="#0B6E55" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={48} height={48} rx={radius} fill="url(#lg)" />
      {/* document */}
      <Path
        d="M17 12 h9 l5 5 v14 a2 2 0 0 1-2 2 h-12 a2 2 0 0 1-2-2 V14 a2 2 0 0 1 2-2 z"
        fill="#ffffff"
        opacity={0.95}
      />
      {/* convert arrows */}
      <Path
        d="M20.5 22.5 a4 4 0 0 1 7-1.3 M20 20 v2.6 h2.6"
        stroke="#0B6E55"
        strokeWidth={1.7}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M27.5 26.5 a4 4 0 0 1-7 1.3 M28 29 v-2.6 h-2.6"
        stroke="#0B6E55"
        strokeWidth={1.7}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
