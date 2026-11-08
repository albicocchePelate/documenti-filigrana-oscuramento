import { ImpostazioniFiligrana, disegnaPagina, fontPronto } from '../filigrana/disegna';
import { Pagina, apriPagina, liberaFoglio } from '../pagina';
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

/** Un PDF con queste pagine. `nome` è il nome del file senza estensione. */
export async function salvaPdf(
  pagine: Pagina[],
  filigrana: ImpostazioniFiligrana,
  nome: string,
): Promise<void> {
  const pronte = [];
  for (const pagina of pagine) {
    pronte.push({
      jpeg: await inJpeg(pagina, filigrana),
      larghezza: pagina.larghezza,
      altezza: pagina.altezza,
    });
  }
  salva(creaPdf(pronte), `${nome}.pdf`);
}

/** Le immagini: una sola si scarica così com'è, più d'una in uno ZIP («nome-1.jpg», «nome-2.jpg»…) */
export async function salvaImmagini(
  pagine: Pagina[],
  filigrana: ImpostazioniFiligrana,
  nome: string,
): Promise<void> {
  if (pagine.length === 1) {
    const jpeg = await inJpeg(pagine[0], filigrana);
    salva(new Blob([jpeg as BlobPart], { type: 'image/jpeg' }), `${nome}.jpg`);
    return;
  }
  const immagini = [];
  for (const [i, pagina] of pagine.entries()) {
    immagini.push({ nome: `${nome}-${i + 1}.jpg`, contenuto: await inJpeg(pagina, filigrana) });
  }
  salva(creaZip(immagini), `${nome}.zip`);
}

/**
 * La pagina con la filigrana, in JPEG. Il JPEG rifatto da zero non porta con sé metadati.
 * Si apre una pagina alla volta e la si chiude subito: anche i documenti lunghi stanno in memoria.
 */
async function inJpeg(pagina: Pagina, filigrana: ImpostazioniFiligrana): Promise<Uint8Array> {
  await fontPronto;
  const immagine = await apriPagina(pagina);
  const foglio = document.createElement('canvas');
  disegnaPagina(foglio, immagine, pagina.zone, filigrana);
  immagine.close();
  const jpeg = await new Promise<Blob>((pronta, errore) =>
    foglio.toBlob((blob) => (blob ? pronta(blob) : errore()), 'image/jpeg', 0.9),
  );
  liberaFoglio(foglio);
  return new Uint8Array(await jpeg.arrayBuffer());
}

function salva(contenuto: Blob, nome: string): void {
  const collegamento = document.createElement('a');
  collegamento.href = URL.createObjectURL(contenuto);
  collegamento.download = nome;
  collegamento.click();
  setTimeout(() => URL.revokeObjectURL(collegamento.href), 1000);
}
