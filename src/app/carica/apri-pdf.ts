import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Le immagini JPX (frequenti nelle scansioni) pdf.js le decodifica con un modulo a parte. La sua
 * versione WebAssembly andrebbe scaricata con fetch, che la pagina blocca: si usa quella in
 * JavaScript, che si carica come un normale script. La copia la mette angular.json.
 */
const CARTELLA_PDFJS = new URL('pdfjs/', document.baseURI).href;
export const DECODIFICATORE_JPX = `${CARTELLA_PDFJS}openjpeg_nowasm_fallback.js`;

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
    useWasm: false,
    wasmUrl: CARTELLA_PDFJS,
  }).promise;
}
