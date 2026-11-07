import { disegnaPagina, fontPronto } from '../filigrana/disegna';
import { Pagina } from '../pagina';

/** Una immagine per pagina, con la filigrana. Il JPEG rifatto da zero non porta con sé metadati. */
export async function salvaImmagini(pagine: Pagina[], testo: string): Promise<void> {
  await fontPronto;
  for (const pagina of pagine) {
    const foglio = document.createElement('canvas');
    disegnaPagina(foglio, pagina, testo);
    const immagine = await new Promise<Blob>((pronta, errore) =>
      foglio.toBlob((blob) => (blob ? pronta(blob) : errore()), 'image/jpeg', 0.9),
    );
    salva(immagine, `${pagina.nome}-con-filigrana.jpg`);
  }
}

function salva(contenuto: Blob, nome: string): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(contenuto);
  link.download = nome;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
