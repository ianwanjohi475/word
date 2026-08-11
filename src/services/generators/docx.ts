/** Word (.docx) generator built on the `docx` library. Returns base64. */
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { DocumentModel, TableBlock } from '@/types';

const BRAND = '5B5BF0';
const HEADER_FILL = 'EEEEFE';
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: 'DCE0E8' };

function headingLevel(level: 1 | 2 | 3) {
  if (level === 1) return HeadingLevel.HEADING_1;
  if (level === 2) return HeadingLevel.HEADING_2;
  return HeadingLevel.HEADING_3;
}

function buildTable(t: TableBlock): Table {
  const rows: TableRow[] = [];
  const cols = Math.max(t.headers?.length ?? 0, ...t.rows.map((r) => r.length), 1);

  if (t.headers) {
    rows.push(
      new TableRow({
        tableHeader: true,
        children: t.headers.map(
          (h) =>
            new TableCell({
              shading: { fill: HEADER_FILL },
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: h, bold: true, color: '2B3446' })],
                }),
              ],
            })
        ),
      })
    );
  }

  for (const row of t.rows) {
    const cells: TableCell[] = [];
    for (let c = 0; c < cols; c++) {
      cells.push(
        new TableCell({
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun(row[c] ?? '')] })],
        })
      );
    }
    rows.push(new TableRow({ children: cells }));
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: BORDER,
      bottom: BORDER,
      left: BORDER,
      right: BORDER,
      insideHorizontal: BORDER,
      insideVertical: BORDER,
    },
    rows,
  });
}

export async function generateDocx(doc: DocumentModel): Promise<string> {
  const children: (Paragraph | Table)[] = [];

  if (doc.title) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        spacing: { after: 240 },
        children: [new TextRun({ text: doc.title, bold: true, color: '151922' })],
      })
    );
  }

  for (const block of doc.blocks) {
    if (block.type === 'heading') {
      children.push(
        new Paragraph({
          heading: headingLevel(block.level),
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({ text: block.text, bold: true, color: block.level === 1 ? BRAND : '232834' }),
          ],
        })
      );
    } else if (block.type === 'paragraph') {
      children.push(
        new Paragraph({
          spacing: { after: 140, line: 300 },
          children: [new TextRun(block.text)],
        })
      );
    } else {
      children.push(buildTable(block));
      children.push(new Paragraph({ spacing: { after: 140 }, children: [] }));
    }
  }

  if (children.length === 0) {
    children.push(new Paragraph({ children: [new TextRun('')] }));
  }

  const document = new Document({
    creator: 'Converta',
    title: doc.title ?? 'Converted Document',
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22, color: '232834' } },
      },
    },
    sections: [
      {
        properties: { page: { margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
        children: [
          ...children,
          new Paragraph({
            spacing: { before: 400 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Generated with Converta', size: 16, color: '9BA3B2', italics: true }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBase64String(document);
}
