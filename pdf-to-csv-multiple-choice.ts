import { PdfToCsvConverter } from './pdf-to-csv';

// Main execution for multiple-choice questions
async function main() {
  const converter = new PdfToCsvConverter('multiple-choice');
  await converter.convertPdfToCSV();
}

if (require.main === module) {
  main().catch(console.error);
}