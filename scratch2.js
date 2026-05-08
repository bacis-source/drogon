const fs = require('fs');
const pdfParse = require('pdf-parse');

async function test() {
  try {
    const text = 'test pdf generation... wait, I just need to create a dummy pdf or docx';
    console.log("PDF Parse loaded successfully");
  } catch(e) {
    console.error(e);
  }
}
test();
