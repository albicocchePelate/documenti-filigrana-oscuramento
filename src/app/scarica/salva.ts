import { ImpostazioniFiligrana, disegnaPagina, fontPronto } from '../filigrana/disegna';
import { Pagina } from '../pagina';
import { creaPdf } from './crea-pdf';
import { creaZip } from './crea-zip';

/** Le pagine raggruppate per documento, nell'ordine in cui compaiono */
export function perDocumento(pagine: Pagina[]): Pagina[][] {
  const gruppi = new Map<string, Pagina[]>();
  for (const pagina of pagine) {
    gruppi.set(pagina.documento, [...(gruppi.get(pagina.documento) ?? []), pagina]);
  }
  return [...gruppi.values()];
}

/** Un PDF con queste pagine: con il nome del documento, o «documenti» se sono più d'uno */
export async function salvaPdf(pagine: Pagina[], filigrana: ImpostazioniFiligrana): Promise<void> {
  const pronte = [];
  for (const pagina of pagine) {
    pronte.push({
      jpeg: await inJpeg(pagina, filigrana),
      larghezza: pagina.immagine.width,
      altezza: pagina.immagine.height,
    });
  }
  const nome = perDocumento(pagine).length === 1 ? pagine[0].documento : 'documenti';
  salva(creaPdf(pronte), `${nome}-con-filigrana.pdf`);
}

/** Le immagini: una sola si scarica così com'è, più d'una in uno ZIP */
export async function salvaImmagini(
  pagine: Pagina[],
  filigrana: ImpostazioniFiligrana,
): Promise<void> {
  const immagini = [];
  for (const pagina of pagine) {
    immagini.push({
      nome: `${pagina.nome}-con-filigrana.jpg`,
      contenuto: await inJpeg(pagina, filigrana),
    });
  }
  if (immagini.length === 1) {
    salva(new Blob([immagini[0].contenuto as BlobPart], { type: 'image/jpeg' }), immagini[0].nome);
  } else {
    salva(creaZip(immagini), 'immagini-con-filigrana.zip');
  }
}

/** La pagina con la filigrana, in JPEG. Il JPEG rifatto da zero non porta con sé metadati. */
async function inJpeg(pagina: Pagina, filigrana: ImpostazioniFiligrana): Promise<Uint8Array> {
  await fontPronto;
  const foglio = document.createElement('canvas');
  disegnaPagina(foglio, pagina, filigrana);
  const jpeg = await new Promise<Blob>((pronta, errore) =>
    foglio.toBlob((blob) => (blob ? pronta(blob) : errore()), 'image/jpeg', 0.9),
  );
  return new Uint8Array(await jpeg.arrayBuffer());
}

function salva(contenuto: Blob, nome: string): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(contenuto);
  link.download = nome;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
