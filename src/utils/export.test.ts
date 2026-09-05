import { describe, it, expect } from 'vitest';
import { CSV_HEADERS, generateCSVContent, generateExcelXML } from './export';
import { CourseResultRow } from '../types';

describe('Export Service (Specification §26)', () => {
  const sampleRows: CourseResultRow[] = [
    {
      student: {
        id: 'std_1',
        fullName: 'Hassan Mahmoud',
        phone: '01012345678',
        email: 'hassan@example.com',
        nationalId: '29801011234567',
        createdAt: '2026-09-01T10:00:00Z',
      },
      preScore: 16,
      preMaxScore: 20, // 80%
      postScore: 19,
      postMaxScore: 20, // 95%
      improvementPercentage: 15.0, // +15%
      preStatus: 'Completed',
      postStatus: 'Completed',
      resultStatus: 'PUBLISHED',
    },
    {
      student: {
        id: 'std_2',
        fullName: 'Fatma Ali',
        phone: '01122334455',
        email: 'fatma@example.com',
        nationalId: '29902021234567',
        createdAt: '2026-09-01T10:00:00Z',
      },
      preScore: undefined,
      preMaxScore: undefined,
      postScore: 18,
      postMaxScore: 20,
      improvementPercentage: null, // N/A because Pre is missing
      preStatus: 'Not Started',
      postStatus: 'Completed',
      resultStatus: 'REVIEWED',
    },
  ];

  it('contains the exact 10 mandated columns in CSV header (§26)', () => {
    expect(CSV_HEADERS).toEqual([
      'Name',
      'Phone',
      'Email',
      'National ID',
      'Pre Score',
      'Post Score',
      'Improvement',
      'Pre Status',
      'Post Status',
      'Result Status',
    ]);
  });

  it('formats CSV rows with correct values and percentage-point improvement', () => {
    const csv = generateCSVContent(sampleRows);
    const lines = csv.split('\r\n');

    expect(lines.length).toBe(3); // Header + 2 rows

    // Row 1: Both Pre and Post completed
    expect(lines[1]).toContain('"Hassan Mahmoud"');
    expect(lines[1]).toContain('"29801011234567"');
    expect(lines[1]).toContain('"16 / 20 (80%)"');
    expect(lines[1]).toContain('"19 / 20 (95%)"');
    expect(lines[1]).toContain('"+15%"');
    expect(lines[1]).toContain('"PUBLISHED"');

    // Row 2: Post only completed, Pre is missing -> improvement is N/A (§24, §26)
    expect(lines[2]).toContain('"Fatma Ali"');
    expect(lines[2]).toContain('"N/A"'); // Pre score N/A and Improvement N/A
    expect(lines[2]).toContain('"Not Started"');
    expect(lines[2]).toContain('"Completed"');
    expect(lines[2]).toContain('"REVIEWED"');
  });

  it('generates valid Microsoft Excel XML structure with formatted cells', () => {
    const xml = generateExcelXML(sampleRows);

    expect(xml).toContain('<?xml version="1.0"?>');
    expect(xml).toContain('<Workbook');
    expect(xml).toContain('<Worksheet ss:Name="Assessment Results">');
    expect(xml).toContain('<Data ss:Type="String">Hassan Mahmoud</Data>');
    expect(xml).toContain('<Data ss:Type="String">29801011234567</Data>');
    expect(xml).toContain('<Data ss:Type="String">+15%</Data>');
  });
});
