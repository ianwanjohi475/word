/**
 * Beautiful file-format icon: a rounded document shape with a folded corner and
 * the format badge (DOCX / XLSX / PDF / TXT), colored per format. Rendered with
 * SVG so it stays crisp at any size.
 */
import React from 'react';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';
import { formatColors } from '@/theme/tokens';
import type { OutputFormat, SourceFormat } from '@/types';
import { FORMAT_META } from '@/utils/formats';

interface Props {
  format: OutputFormat;
  size?: number;
}

export function FormatIcon({ format, size = 44 }: Props) {
  const c = formatColors[FORMAT_META[format].color];
  const badge = FORMAT_META[format].badge;
  const w = size;
  const h = size * 1.18;
  const fold = size * 0.32;

  return (
    <Svg width={w} height={h} viewBox="0 0 100 118">
      {/* page body */}
      <Path
        d="M14 6 C14 2.7 16.7 0 20 0 L64 0 L94 30 L94 112 C94 115.3 91.3 118 88 118 L20 118 C16.7 118 14 115.3 14 112 Z"
        fill={c.soft}
        stroke={c.base}
        strokeWidth={4}
      />
      {/* folded corner */}
      <Path d="M64 0 L94 30 L70 30 C66.7 30 64 27.3 64 24 Z" fill={c.base} opacity={0.9} />
      {/* badge chip */}
      <Rect x={10} y={66} width={80} height={30} rx={7} fill={c.base} />
      <SvgText
        x={50}
        y={86}
        fill={c.on}
        fontSize={badge.length > 3 ? 20 : 22}
        fontWeight="700"
        textAnchor="middle"
      >
        {badge}
      </SvgText>
    </Svg>
  );
}

/** Small source-format glyph (PDF / Word / Excel) for the history "from" side. */
export function SourceGlyph({ format, size = 20 }: { format: SourceFormat; size?: number }) {
  const c = format === 'pdf' ? formatColors.pdf : format === 'excel' ? formatColors.excel : formatColors.word;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
        fill={c.soft}
        stroke={c.base}
        strokeWidth={1.6}
      />
      {format === 'excel' ? (
        <Path d="M8.5 10l3 4m0-4l-3 4M14 10v4" stroke={c.base} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      ) : (
        <Path d="M8 12h8M8 15h8M8 9h4" stroke={c.base} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      )}
    </Svg>
  );
}
