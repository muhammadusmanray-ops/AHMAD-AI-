const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function checkPdf() {
  const data = new Uint8Array(fs.readFileSync('./public/quran-taj-company.pdf'));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  console.log("Total pages:", doc.numPages);
  for (const pageNum of [1, 2, 7, 440]) {
    const page = await doc.getPage(pageNum);
    console.log(`Page ${pageNum}: view = ${page.view}, rotate = ${page.rotate}`);
  }
}

checkPdf().catch(console.error);
