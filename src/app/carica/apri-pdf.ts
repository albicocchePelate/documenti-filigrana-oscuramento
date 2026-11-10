import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Apre un PDF con pdf.js. Il suo motore gira nella pagina stessa e non in un worker separato:
 * per i documenti di tutti i giorni basta.
 */
export async function apriPdf(file: File): Promise<PDFDocumentProxy> {
  const [pdfjs] = await Promise.all([
    import('pdfjs-dist'),
    // Caricandolo così, pdf.js lo trova pronto e non cerca un worker
    import('pdfjs-dist/build/pdf.worker.min.mjs'),
  ]);
  return pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    isEvalSupported: false,
  }).promise;
}
