import { disegnaPagina, fontPronto } from '../filigrana/disegna';
import { Pagina } from '../pagina';
import { creaPdf } from './crea-pdf';

/** Un solo PDF con tutte le pagine, nell'ordine dell'anteprima. */
export async function salvaPdf(pagine: Pagina[], testo: string): Promise<void> {
  const pronte = [];
  for (const pagina of pagine) {
    const jpeg = await inJpeg(pagina, testo);
    pronte.push({
      jpeg: new Uint8Array(await jpeg.arrayBuffer()),
      larghezza: pagina.immagine.width,
      altezza: pagina.immagine.height,
    });
  }
  const documenti = new Set(pagine.map((pagina) => pagina.documento));
  const nome = documenti.size === 1 ? pagine[0].documento : 'documenti';
  salva(creaPdf(pronte), `${nome}-con-filigrana.pdf`);
}

/** Una immagine per pagina. */
export async function salvaImmagini(pagine: Pagina[], testo: string): Promise<void> {
  for (const pagina of pagine)
    salva(await inJpeg(pagina, testo), `${pagina.nome}-con-filigrana.jpg`);
}

/** La pagina con la filigrana, in JPEG. Il JPEG rifatto da zero non porta con sé metadati. */
async function inJpeg(pagina: Pagina, testo: string): Promise<Blob> {
  await fontPronto;
  const foglio = document.createElement('canvas');
  disegnaPagina(foglio, pagina, testo);
  return new Promise<Blob>((pronta, errore) =>
    foglio.toBlob((blob) => (blob ? pronta(blob) : errore()), 'image/jpeg', 0.9),
  );
}

function salva(contenuto: Blob, nome: string): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(contenuto);
  link.download = nome;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
