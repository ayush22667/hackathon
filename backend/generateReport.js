const fs = require("fs");
const PDFDocument = require("pdfkit");

function generatePDF(sessionData, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    doc.fontSize(20).text("Patient Telemedical Report", { align: "center" }).moveDown();
    doc.fontSize(14).text(`Patient ID: ${sessionData.patientId}`);
    doc.text(`Date: ${new Date(sessionData.date).toLocaleString()}`).moveDown();

    sessionData.responses.forEach((response, index) => {
      doc.fontSize(12).text(`Q${index + 1}: ${response.question}`, { bold: true });
      doc.fontSize(12).text(`A: ${response.answer}`).moveDown();

      if (response.audioFile) {
        doc.text(`Audio Response: ${response.audioFile}`);
      }
      doc.moveDown();
    });

    doc.end();
    stream.on("finish", () => resolve(outputPath));
    stream.on("error", reject);
  });
}

module.exports = generatePDF;
