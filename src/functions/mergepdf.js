const { app } = require('@azure/functions');
const PDFLib = require('../../libraries/pdf-lib.min.js');
const { Buffer } = require('buffer');

async function MergePDF(pdfObjects) {
    const { PDFDocument } = PDFLib;
    var pdfsToMerge = [];

    for (var j = 0; j < pdfObjects.length; j++) {
      var pdf64 = pdfObjects[j].pdf; // Accessing the 'pdf' key
      var pdfBuffer1 = Buffer.from(pdf64, 'base64');
      pdfsToMerge[j] = pdfBuffer1;
  }

    const mergedPdf = await PDFDocument.create();
    for (const pdfBytes of pdfsToMerge) {
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
        });
    }

    const buf = await mergedPdf.saveAsBase64({ dataUri: false });
    return buf;
}

app.http('mergepdf', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const data = await request.json();
            let finalPdf = await MergePDF(data);
            return {
                status: 200,
                body: finalPdf,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename="merged.pdf"'
                }
            };
        } catch (error) {
            return {
                status: 500,
                body: `Error merging PDFs: ${error.message}`
            };
        }
    },
});
