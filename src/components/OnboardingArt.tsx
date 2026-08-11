/** Onboarding illustrations — a document transforming into editable file formats. */
import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop, G, Circle, Line } from 'react-native-svg';
import { useTheme } from '@/theme';
import { formatColors } from '@/theme/tokens';

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: 260 }}>{children}</View>
  );
}

export function ArtTransform() {
  const theme = useTheme();
  return (
    <Frame>
      <Svg width={280} height={240} viewBox="0 0 280 240">
        <Defs>
          <LinearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#6E6EF6" />
            <Stop offset="1" stopColor="#4A4AD6" />
          </LinearGradient>
        </Defs>
        {/* source document */}
        <G>
          <Rect x={24} y={44} width={104} height={140} rx={12} fill={theme.colors.surface} stroke={theme.colors.border} strokeWidth={2} />
          <Rect x={40} y={64} width={56} height={8} rx={4} fill="url(#g1)" />
          <Rect x={40} y={84} width={72} height={6} rx={3} fill={theme.colors.borderStrong} />
          <Rect x={40} y={98} width={72} height={6} rx={3} fill={theme.colors.borderStrong} />
          <Rect x={40} y={112} width={48} height={6} rx={3} fill={theme.colors.borderStrong} />
          <Rect x={40} y={134} width={72} height={30} rx={4} fill={theme.colors.surfaceAlt} />
        </G>
        {/* arrow */}
        <G>
          <Line x1={140} y1={114} x2={168} y2={114} stroke={theme.colors.accent} strokeWidth={4} strokeLinecap="round" />
          <Path d="M164 106 L176 114 L164 122 Z" fill={theme.colors.accent} />
        </G>
        {/* output format badges fanned out */}
        <G>
          <Rect x={186} y={54} width={64} height={40} rx={10} fill={formatColors.word.base} />
          <Rect x={196} y={100} width={64} height={40} rx={10} fill={formatColors.excel.base} />
          <Rect x={186} y={146} width={64} height={40} rx={10} fill={formatColors.pdf.base} />
        </G>
        <Circle cx={218} cy={30} r={6} fill={formatColors.image.base} opacity={0.5} />
        <Circle cx={60} cy={210} r={5} fill={theme.colors.accent} opacity={0.4} />
      </Svg>
    </Frame>
  );
}

export function ArtScan() {
  const theme = useTheme();
  return (
    <Frame>
      <Svg width={260} height={240} viewBox="0 0 260 240">
        <Defs>
          <LinearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#6E6EF6" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#6E6EF6" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={66} y={30} width={128} height={172} rx={14} fill={theme.colors.surface} stroke={theme.colors.border} strokeWidth={2} />
        <Rect x={86} y={54} width={64} height={9} rx={4} fill={theme.colors.borderStrong} />
        <Rect x={86} y={74} width={88} height={7} rx={3} fill={theme.colors.borderStrong} />
        <Rect x={86} y={90} width={88} height={7} rx={3} fill={theme.colors.borderStrong} />
        <Rect x={86} y={106} width={60} height={7} rx={3} fill={theme.colors.borderStrong} />
        <Rect x={66} y={120} width={128} height={40} fill="url(#scan)" />
        <Line x1={66} y1={120} x2={194} y2={120} stroke={theme.colors.accent} strokeWidth={3} />
        {/* corner brackets */}
        <Path d="M50 40 L50 24 L66 24" stroke={theme.colors.accent} strokeWidth={4} fill="none" strokeLinecap="round" />
        <Path d="M210 40 L210 24 L194 24" stroke={theme.colors.accent} strokeWidth={4} fill="none" strokeLinecap="round" />
        <Path d="M50 192 L50 208 L66 208" stroke={theme.colors.accent} strokeWidth={4} fill="none" strokeLinecap="round" />
        <Path d="M210 192 L210 208 L194 208" stroke={theme.colors.accent} strokeWidth={4} fill="none" strokeLinecap="round" />
      </Svg>
    </Frame>
  );
}

export function ArtEdit() {
  const theme = useTheme();
  return (
    <Frame>
      <Svg width={260} height={240} viewBox="0 0 260 240">
        <Rect x={40} y={40} width={180} height={150} rx={14} fill={theme.colors.surface} stroke={theme.colors.border} strokeWidth={2} />
        {/* table grid */}
        <Rect x={60} y={64} width={140} height={26} rx={4} fill={theme.colors.accentSoft} />
        <Line x1={60} y1={90} x2={200} y2={90} stroke={theme.colors.border} strokeWidth={2} />
        <Line x1={60} y1={116} x2={200} y2={116} stroke={theme.colors.border} strokeWidth={2} />
        <Line x1={60} y1={142} x2={200} y2={142} stroke={theme.colors.border} strokeWidth={2} />
        <Line x1={107} y1={64} x2={107} y2={168} stroke={theme.colors.border} strokeWidth={2} />
        <Line x1={154} y1={64} x2={154} y2={168} stroke={theme.colors.border} strokeWidth={2} />
        <Rect x={60} y={142} width={140} height={26} rx={0} fill={theme.colors.accent} opacity={0.12} />
        {/* pencil */}
        <G>
          <Path d="M176 150 l30 -30 12 12 -30 30 -14 2 z" fill={theme.colors.accent} />
          <Path d="M206 120 l8 -8 12 12 -8 8 z" fill={theme.colors.accentPressed} />
        </G>
      </Svg>
    </Frame>
  );
}
