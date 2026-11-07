/** Un file da mettere nello ZIP */
export interface FileZip {
  nome: string;
  contenuto: Uint8Array;
}

/**
 * Uno ZIP senza compressione: i JPEG sono già compressi, comprimerli di nuovo non serve.
 * Il formato è semplice: per ogni file un'intestazione e il contenuto, poi un indice finale.
 */
export function creaZip(file: FileZip[]): Blob {
  const pezzi: Uint8Array[] = [];
  const indice: Uint8Array[] = [];
  let posizione = 0;

  for (const { nome, contenuto } of file) {
    const nomeInByte = new TextEncoder().encode(nome);
    const crc = crc32(contenuto);

    // Intestazione locale: firma, versione, flag (UTF-8), metodo 0 (nessuna compressione), crc, misure
    const locale = intestazione(30, [
      [0x04034b50, 4],
      [20, 2],
      [0x0800, 2],
      [0, 2],
      [0, 2],
      [0, 2],
      [crc, 4],
      [contenuto.length, 4],
      [contenuto.length, 4],
      [nomeInByte.length, 2],
      [0, 2],
    ]);
    // La stessa voce nell'indice finale, con in più la posizione del file
    const voce = intestazione(46, [
      [0x02014b50, 4],
      [20, 2],
      [20, 2],
      [0x0800, 2],
      [0, 2],
      [0, 2],
      [0, 2],
      [crc, 4],
      [contenuto.length, 4],
      [contenuto.length, 4],
      [nomeInByte.length, 2],
      [0, 2],
      [0, 2],
      [0, 2],
      [0, 2],
      [0, 4],
      [posizione, 4],
    ]);

    pezzi.push(locale, nomeInByte, contenuto);
    indice.push(voce, nomeInByte);
    posizione += locale.length + nomeInByte.length + contenuto.length;
  }

  const misuraIndice = indice.reduce((somma, pezzo) => somma + pezzo.length, 0);
  const fine = intestazione(22, [
    [0x06054b50, 4],
    [0, 2],
    [0, 2],
    [file.length, 2],
    [file.length, 2],
    [misuraIndice, 4],
    [posizione, 4],
    [0, 2],
  ]);
  return new Blob([...pezzi, ...indice, fine] as BlobPart[], { type: 'application/zip' });
}

/** Numeri scritti uno dopo l'altro, in little-endian, come vuole il formato ZIP */
function intestazione(lunghezza: number, campi: [valore: number, byte: number][]): Uint8Array {
  const dati = new DataView(new ArrayBuffer(lunghezza));
  let offset = 0;
  for (const [valore, byte] of campi) {
    if (byte === 4) dati.setUint32(offset, valore >>> 0, true);
    else dati.setUint16(offset, valore, true);
    offset += byte;
  }
  return new Uint8Array(dati.buffer);
}

/** Il controllo CRC-32 che lo ZIP chiede per ogni file */
const TABELLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(dati: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of dati) crc = TABELLA_CRC[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
