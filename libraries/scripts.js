//USED FUNCTIONS

function Render(html) {
    HTMLContainer.insertAdjacentHTML('beforeend', html);
}

function Refresh(html) {
    //svg = document.getElementById("controlAddIn");
    //svg.insertAdjacentHTML('afterbegin', html);

    document.getElementById("container").innerHTML = html
}

async function CreatePDFversionOfsvg(string, width, height, itemno) {
    const { PDFDocument, StandardFonts, rgb } = PDFLib

    //We create the pdf out of the svg
    //var pdf = new jsPDF('l', 'pt', [380, 300]);
    pdf = new jsPDF('l', 'pt', [height, width]);
    //pdf.canvas.height = height;
    //pdf.canvas.width = width;

    //We create an element with the svg

    var div = document.createElement('div');
    div.innerHTML = string.trim();
    svg = div.firstElementChild;

    svg2pdf(svg, pdf, {
        //removeInvalid: true,
        removeInvalid: false,
        scale: 72 / 96, // this is the ratio of px to pt units
    });
    /*
        pdf.save('Test.pdf');
    
        var string = pdf.output('dataurlstring');
        var stringtoremove = "data:application/pdf;filename=generated.pdf;base64,";
        pdf64 = string.replace(stringtoremove, "");
        */



    var blob = pdf.output('blob');

    var reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = function () {
        var base64data = reader.result;
        pdf64 = base64data.replace("data:application/pdf;base64,", "");
        var pdftoNAV = [pdf64, itemno];
        Microsoft.Dynamics.NAV.InvokeExtensibilityMethod("SaveSVGpdfbase64", pdftoNAV);
    }

}

async function CreateProdOrder(prodorderpdf, svgpdf1) {
    const { PDFDocument } = PDFLib

    const pdfDoc = await PDFDocument.load(prodorderpdf);
    const dataUri1 = 'data:application/pdf;base64,' + svgpdf1;


    const [svgpdf10] = await pdfDoc.embedPdf(dataUri1);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    firstPage.drawPage(svgpdf10, {
        x: 10,
        y: 480,
    });

    //const pdfBytes = await pdfDoc.save();
    //download(pdfBytes, "ProdOrder.pdf", "application/pdf");
    const buf = await pdfDoc.saveAsBase64();
    var pdftoNAV = [buf]
    Microsoft.Dynamics.NAV.InvokeExtensibilityMethod("DownloadPDF", pdftoNAV);
}

async function CreateSalesOrder(SalesOrderpdf, salesorderlinepdf1, svgpdf1, salesorderlinepdf2, svgpdf2) {
    const { PDFDocument } = PDFLib

    //Header
    var raw1 = window.atob(SalesOrderpdf);
    var len1 = raw1.length;
    var pdfBuffer1 = new Uint8Array(new ArrayBuffer(len1));
    for (var i = 0; i < len1; i++) {
        pdfBuffer1[i] = raw1.charCodeAt(i);
    }

    const pdfDoc1 = await PDFDocument.load(salesorderlinepdf1);
    const pdfDoc2 = await PDFDocument.load(salesorderlinepdf2);
    const dataUri1 = 'data:application/pdf;base64,' + svgpdf1;
    const dataUri2 = 'data:application/pdf;base64,' + svgpdf2;


    const [svgpdf10] = await pdfDoc1.embedPdf(dataUri1);
    const [svgpdf20] = await pdfDoc2.embedPdf(dataUri2);
    const pages1 = pdfDoc1.getPages();
    const pages2 = pdfDoc2.getPages();
    const firstPage1 = pages1[0];
    const firstPage2 = pages2[0];
    firstPage1.drawPage(svgpdf10, {
        x: 10,
        y: 480,
    });

    firstPage2.drawPage(svgpdf20, {
        x: 10,
        y: 480,
    });


    const pdfBytes1 = await pdfDoc1.save();
    const pdfBytes2 = await pdfDoc2.save();

    var pdfsToMerge = [pdfBuffer1, pdfBytes1, pdfBytes2]

    const mergedPdf = await PDFDocument.create();
    for (const pdfBytes of pdfsToMerge) {
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
        });
    }

    const buf = await mergedPdf.saveAsBase64();
    var pdftoNAV = [buf]
    Microsoft.Dynamics.NAV.InvokeExtensibilityMethod("DownloadPDF", pdftoNAV);
}
//We convert the Uint8Array into base64
function toBase64(dataArr) {
    var encoder = new TextEncoder("ascii");
    var decoder = new TextDecoder("ascii");
    var base64Table = encoder.encode('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=');
    var padding = dataArr.byteLength % 3;
    var len = dataArr.byteLength - padding;
    padding = padding > 0 ? (3 - padding) : 0;
    var outputLen = ((len / 3) * 4) + (padding > 0 ? 4 : 0);
    var output = new Uint8Array(outputLen);
    var outputCtr = 0;
    for (var i = 0; i < len; i += 3) {
        var buffer = ((dataArr[i] & 0xFF) << 16) | ((dataArr[i + 1] & 0xFF) << 8) | (dataArr[i + 2] & 0xFF);
        output[outputCtr++] = base64Table[buffer >> 18];
        output[outputCtr++] = base64Table[(buffer >> 12) & 0x3F];
        output[outputCtr++] = base64Table[(buffer >> 6) & 0x3F];
        output[outputCtr++] = base64Table[buffer & 0x3F];
    }
    if (padding == 1) {
        var buffer = ((dataArr[len] & 0xFF) << 8) | (dataArr[len + 1] & 0xFF);
        output[outputCtr++] = base64Table[buffer >> 10];
        output[outputCtr++] = base64Table[(buffer >> 4) & 0x3F];
        output[outputCtr++] = base64Table[(buffer << 2) & 0x3F];
        output[outputCtr++] = base64Table[64];
    } else if (padding == 2) {
        var buffer = dataArr[len] & 0xFF;
        output[outputCtr++] = base64Table[buffer >> 2];
        output[outputCtr++] = base64Table[(buffer << 4) & 0x3F];
        output[outputCtr++] = base64Table[64];
        output[outputCtr++] = base64Table[64];
    }

    var ret = decoder.decode(output);
    output = null;
    dataArr = null;
    return ret;

}

async function CreateSalesOrder2(string) {
    const { PDFDocument } = PDFLib
    const obj = JSON.parse(string);
    const SalesOrderpdf = obj.header;

    const linereport = [];
    const svgpdf = [];
    const pdfDoc = [];
    const dataUri = [];
    const pages = [];
    const firstPage = [];
    const pdfBytes = [];
    var pdfsToMerge = [];


    //Header
    var raw1 = window.atob(SalesOrderpdf);
    var len1 = raw1.length;
    var pdfBuffer1 = new Uint8Array(new ArrayBuffer(len1));
    for (var i = 0; i < len1; i++) {
        pdfBuffer1[i] = raw1.charCodeAt(i);
    }

    pdfsToMerge[0] = pdfBuffer1;

    //Lines
    for (var i = 0; i < obj.line.length; i++) {

        linereport[i] = obj.line[i].linereport;
        svgpdf[i] = obj.line[i].svg;

        pdfDoc[i] = await PDFDocument.load(linereport[i]);
        dataUri[i] = 'data:application/pdf;base64,' + svgpdf[i];
        const [svgpdf10] = await pdfDoc[i].embedPdf(dataUri[i]);
        pages[i] = pdfDoc[i].getPages();
        firstPage[i] = pages[i][0];
        firstPage[i].drawPage(svgpdf10, {
            x: 10,
            y: 480,
        });

        pdfBytes[i] = await pdfDoc[i].save();
        pdfsToMerge[i + 1] = pdfBytes[i];
    }

    const mergedPdf = await PDFDocument.create();
    for (const pdfBytes of pdfsToMerge) {
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
        });
    }

    const buf = await mergedPdf.saveAsBase64();
    var pdftoNAV = [buf]
    Microsoft.Dynamics.NAV.InvokeExtensibilityMethod("DownloadPDF", pdftoNAV);
}






//Not needed functions
//This function just takes an svg from window and makes a pdf out of it
async function createPdf(string, pdf164) {
    //We create the svg pdf
    var svg = document.getElementById('container').querySelector("svg"),
        pdf = new jsPDF('l', 'pt', [400, 250]);



    svg2pdf(svg, pdf, {
        removeInvalid: true,
        scale: 72 / 96, // this is the ratio of px to pt units
    });

    pdf.output('dataurlnewwindow');
    //pdf of the svg in base64
    //var pdf264 = pdf.output('datauri');  
}
//This function takes a svg string and creates a pdf for it. NOT USE
async function printSVG(string) {
    //We create the svg pdf
    //var svg = document.getElementById('container').querySelector("svg"),
    var pdf = new jsPDF('l', 'pt', [842, 595]);


    //We create an element with the svg

    var div = document.createElement('div');
    div.innerHTML = string.trim();
    svg = div.firstElementChild;

    svg2pdf(svg, pdf, {
        removeInvalid: true,
        scale: 72 / 96, // this is the ratio of px to pt units
    });


    pdf.output('dataurlnewwindow');
    //pdf of the svg in base64
    //var pdf264 = pdf.output('datauri');  
}
//This function takes 2 pdfs in base64, merge them and send them back to BC
async function MergePDF(pdf164, pdf264) {
    const { PDFDocument, StandardFonts, rgb } = PDFLib

    //var pdfBuffer1 = fs.readFileSync("./pdf1.pdf"); 
    //var pdfBuffer2 = fs.readFileSync("./pdf2.pdf");
    var raw1 = window.atob(pdf164);
    var len1 = raw1.length;
    var pdfBuffer1 = new Uint8Array(new ArrayBuffer(len1));
    for (var i = 0; i < len1; i++) {
        pdfBuffer1[i] = raw1.charCodeAt(i);
    }

    var raw2 = window.atob(pdf264);
    var len2 = raw2.length;
    var pdfBuffer2 = new Uint8Array(new ArrayBuffer(len2));
    for (var i = 0; i < len2; i++) {
        pdfBuffer2[i] = raw2.charCodeAt(i);
    }

    var pdfsToMerge = [pdfBuffer1, pdfBuffer2]

    const mergedPdf = await PDFDocument.create();
    for (const pdfBytes of pdfsToMerge) {
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
        });
    }

    const buf = await mergedPdf.saveAsBase64();
    var pdftoNAV = [buf]
    Microsoft.Dynamics.NAV.InvokeExtensibilityMethod("DownloadPDF", pdftoNAV);

}
//This function takes a pdf and a svg(html) and merge them and send them back to BC
async function svg(pdf164, string) {
    const { PDFDocument, StandardFonts, rgb } = PDFLib

    //We transform the first string base64 to pdf binary
    var raw1 = window.atob(pdf164);
    var len1 = raw1.length;
    var pdfBuffer1 = new Uint8Array(new ArrayBuffer(len1));
    for (var i = 0; i < len1; i++) {
        pdfBuffer1[i] = raw1.charCodeAt(i);
    }

    //We create the second pdf out of the svg
    //var pdf = new jsPDF('l', 'pt', [380, 300]);
    pdf = new jsPDF('p', 'pt', 'a4');
    pdf.canvas.height = 72 * 11;
    pdf.canvas.width = 72 * 8.5;

    //We create an element with the svg

    var div = document.createElement('div');
    div.innerHTML = string.trim();
    svg = div.firstElementChild;

    svg2pdf(svg, pdf, {
        removeInvalid: true,
        scale: 72 / 96, // this is the ratio of px to pt units
    });

    //pdf.output('dataurlnewwindow');
    pdf2 = new Uint8Array(pdf.output('arraybuffer'))

    var pdfsToMerge = [pdfBuffer1, pdf2];

    const mergedPdf = await PDFDocument.create();
    for (const pdfBytes of pdfsToMerge) {
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
        });
    }

    const buf = await mergedPdf.saveAsBase64();
    console.log(buf);
    var pdftoNAV = [buf]
    Microsoft.Dynamics.NAV.InvokeExtensibilityMethod("DownloadPDF", pdftoNAV);

}
//This function combinnes one pdf into another
async function CreateCombinePDFversionOfsvg(svgpdf1, svgpdf2) {
    const { PDFDocument } = PDFLib

    const pdfDoc = await PDFDocument.create();
    const dataUri1 = 'data:application/pdf;base64,' + svgpdf1;
    const dataUri2 = 'data:application/pdf;base64,' + svgpdf2;


    const [svgpdf10] = await pdfDoc.embedPdf(dataUri1);
    const [svgpdf20] = await pdfDoc.embedPdf(dataUri2);
    //const svgDims1 = svgpdf1.scale(0.3);
    //const svgDims2 = svgpdf2.scale(0.3);
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize()
    page.drawPage(svgpdf10, {
        x: 10,
        y: height - 279,
    });
    page.drawPage(svgpdf20, {
        x: 10,
        y: height - 279 - 400,
    });

    const pdfBytes = await pdfDoc.save();
    download(pdfBytes, "pdf-lib_pdf_page_embedding_example.pdf", "application/pdf");
}