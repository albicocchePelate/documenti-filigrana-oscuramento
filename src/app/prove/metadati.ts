import { apriPdf } from '../carica/apri-pdf';
import { formato } from '../carica/leggi';

/**
 * Cosa raccontava il file oltre al documento: posizione, telefono, data, autore, programma.
 * Lo mostriamo per far vedere cosa non finisce nella copia (che è rifatta da zero e non ne ha).
 */
/** Un dato nascosto nel file: «Posizione» → «45.46, 9.19» */
export interface Metadato {
  etichetta: string;
  valore: string;
}

export async function leggiMetadati(file: File): Promise<Metadato[]> {
  try {
    return formato(file) === 'pdf' ? await delPdf(file) : await dellaFoto(file);
  } catch {
    return [];
  }
}

async function dellaFoto(file: File): Promise<Metadato[]> {
  const { default: exifr } = await import('exifr');
  const dati = await exifr.parse(file, { gps: true, tiff: true, exif: true });
  if (!dati) return [];
  const dispositivo = [dati.Make, dati.Model].filter(Boolean).join(' ');
  return elenco({
    Posizione:
      dati.latitude !== undefined && `${dati.latitude.toFixed(5)}, ${dati.longitude.toFixed(5)}`,
    Dispositivo: dispositivo,
    Obiettivo: dati.LensModel,
    Scattata: dati.DateTimeOriginal && giorno(dati.DateTimeOriginal),
    Programma: dati.Software,
    Autore: dati.Artist,
  });
}

async function delPdf(file: File): Promise<Metadato[]> {
  const documento = await apriPdf(file);
  const info = (await documento.getMetadata()).info as Record<string, string>;
  await documento.destroy();
  const { PDFDateString } = await import('pdfjs-dist');
  const data = info['CreationDate'] && PDFDateString.toDateObject(info['CreationDate']);
  return elenco({
    Titolo: info['Title'],
    Autore: info['Author'],
    'Creato con': info['Creator'],
    Programma: info['Producer'],
    Creato: data && giorno(data),
  });
}

/** Solo i dati presenti. Certi valori sono lunghissimi (il nome completo di un programma): basta l'inizio */
function elenco(dati: Record<string, unknown>): Metadato[] {
  return Object.entries(dati)
    .filter(([, valore]) => typeof valore === 'string' && valore.trim())
    .map(([etichetta, valore]) => {
      const testo = (valore as string).trim();
      return { etichetta, valore: testo.length > 44 ? `${testo.slice(0, 42)}…` : testo };
    });
}

function giorno(data: Date): string {
  return data.toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' });
}
