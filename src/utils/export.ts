import { CourseResultRow } from '../types';

export const CSV_HEADERS = [
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
];

export function generateCSVContent(rows: CourseResultRow[]): string {
  const csvRows = rows.map((r) => {
    const preScoreStr =
      r.preScore !== undefined && r.preMaxScore
        ? `${r.preScore} / ${r.preMaxScore} (${Math.round((r.preScore / r.preMaxScore) * 100)}%)`
        : 'N/A';

    const postScoreStr =
      r.postScore !== undefined && r.postMaxScore
        ? `${r.postScore} / ${r.postMaxScore} (${Math.round((r.postScore / r.postMaxScore) * 100)}%)`
        : 'N/A';

    const improvementStr =
      r.improvementPercentage !== null && r.improvementPercentage !== undefined
        ? `${r.improvementPercentage > 0 ? '+' : ''}${r.improvementPercentage}%`
        : 'N/A';

    return [
      `"${r.student.fullName.replace(/"/g, '""')}"`,
      `"${r.student.phone}"`,
      `"${r.student.email}"`,
      `"${r.student.nationalId}"`,
      `"${preScoreStr}"`,
      `"${postScoreStr}"`,
      `"${improvementStr}"`,
      `"${r.preStatus}"`,
      `"${r.postStatus}"`,
      `"${r.resultStatus.replace('_', ' ')}"`,
    ].join(',');
  });

  return [CSV_HEADERS.join(','), ...csvRows].join('\r\n');
}

export function exportToCSV(courseName: string, rows: CourseResultRow[]) {
  const csvContent = generateCSVContent(rows);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const sanitizedName = courseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.setAttribute('download', `${sanitizedName}_results.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateExcelXML(rows: CourseResultRow[]): string {
  const xmlHeader = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="Data">
   <Alignment ss:Horizontal="Left"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Assessment Results">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Name</Data></Cell>
    <Cell><Data ss:Type="String">Phone</Data></Cell>
    <Cell><Data ss:Type="String">Email</Data></Cell>
    <Cell><Data ss:Type="String">National ID</Data></Cell>
    <Cell><Data ss:Type="String">Pre Score</Data></Cell>
    <Cell><Data ss:Type="String">Post Score</Data></Cell>
    <Cell><Data ss:Type="String">Improvement</Data></Cell>
    <Cell><Data ss:Type="String">Pre Status</Data></Cell>
    <Cell><Data ss:Type="String">Post Status</Data></Cell>
    <Cell><Data ss:Type="String">Result Status</Data></Cell>
   </Row>`;

  const xmlRows = rows.map((r) => {
    const preScoreStr =
      r.preScore !== undefined && r.preMaxScore
        ? `${r.preScore} / ${r.preMaxScore} (${Math.round((r.preScore / r.preMaxScore) * 100)}%)`
        : 'N/A';

    const postScoreStr =
      r.postScore !== undefined && r.postMaxScore
        ? `${r.postScore} / ${r.postMaxScore} (${Math.round((r.postScore / r.postMaxScore) * 100)}%)`
        : 'N/A';

    const improvementStr =
      r.improvementPercentage !== null && r.improvementPercentage !== undefined
        ? `${r.improvementPercentage > 0 ? '+' : ''}${r.improvementPercentage}%`
        : 'N/A';

    return `   <Row ss:StyleID="Data">
    <Cell><Data ss:Type="String">${escapeXml(r.student.fullName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.student.phone)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.student.email)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.student.nationalId)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(preScoreStr)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(postScoreStr)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(improvementStr)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.preStatus)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.postStatus)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.resultStatus.replace('_', ' '))}</Data></Cell>
   </Row>`;
  }).join('\n');

  const xmlFooter = `  </Table>
 </Worksheet>
</Workbook>`;

  return xmlHeader + '\n' + xmlRows + '\n' + xmlFooter;
}

export function exportToExcel(courseName: string, rows: CourseResultRow[]) {
  const xml = generateExcelXML(rows);
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const sanitizedName = courseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.setAttribute('download', `${sanitizedName}_results.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
