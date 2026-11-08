import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Anteprima } from './anteprima/anteprima';
import { Carica } from './carica/carica';
import { formato, leggiFile } from './carica/leggi';
import { PdfProtetto } from './carica/leggi-pdf';
import {
  ImpostazioniFiligrana,
  STILE_INIZIALE,
  StileFiligrana,
  testoFiligrana,
} from './filigrana/disegna';
import { Filigrana } from './filigrana/filigrana';
import { Pagina, Zona } from './pagina';
import { Metadato, leggiMetadati } from './prove/metadati';
import { Prove } from './prove/prove';
import { perDocumento } from './scarica/salva';
import { Scarica } from './scarica/scarica';

@Component({
  selector: 'app-root',
  imports: [Anteprima, Carica, Filigrana, NgTemplateOutlet, Prove, Scarica],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly pagine = signal<Pagina[]>([]);
  /** Si parte da «Solo per »: di solito basta completarla */
  protected readonly scritta = signal('Solo per ');
  protected readonly data = signal(oggi());
  protected readonly stile = signal<StileFiligrana>(STILE_INIZIALE);
  protected readonly lettura = signal('');
  protected readonly errori = signal<string[]>([]);
  /** Per ogni documento, cosa conteneva oltre al documento (posizione, telefono, autore…) */
  protected readonly metadati = signal<Record<string, Metadato[]>>({});

  protected readonly testo = computed(() => testoFiligrana(this.scritta(), this.data()));
  /** Chi deve solo coprire dei dati può spegnerla */
  protected readonly conFiligrana = signal(true);
  protected readonly filigrana = computed<ImpostazioniFiligrana>(() => ({
    ...this.stile(),
    attiva: this.conFiligrana(),
    testo: this.testo(),
  }));

  protected readonly documenti = computed(() =>
    perDocumento(this.pagine()).map((pagine) => ({
      nome: pagine[0].documento,
      pagine: pagine.length,
    })),
  );

  protected async aggiungi(file: File[]): Promise<void> {
    const errori: string[] = [];
    for (const uno of file) {
      if (!formato(uno)) {
        errori.push(`«${uno.name}»: questo formato non lo leggo. Vanno bene JPG, PNG, HEIC e PDF.`);
        continue;
      }
      this.lettura.set(`Leggo «${uno.name}»…`);
      try {
        const nuove = distinte(
          await leggiFile(uno, (testo) => this.lettura.set(testo)),
          this.pagine(),
        );
        this.pagine.update((pagine) => [...pagine, ...nuove]);
        const righe = await leggiMetadati(uno);
        this.metadati.update((tutti) => ({ ...tutti, [nuove[0].documento]: righe }));
      } catch (errore) {
        errori.push(
          errore instanceof PdfProtetto
            ? `«${uno.name}» è protetto da password: aprilo, salvane una copia senza password e riprova.`
            : `«${uno.name}»: non riesco a leggerlo. Forse è rovinato?`,
        );
      }
    }
    this.lettura.set('');
    this.errori.set(errori);
  }

  protected ricomincia(): void {
    this.pagine.set([]);
    this.metadati.set({});
    this.errori.set([]);
  }

  /** Le zone coperte di una pagina sono cambiate: la pagina viene sostituita con quella nuova */
  protected copri({ pagina, zone }: { pagina: Pagina; zone: Zona[] }): void {
    this.pagine.update((pagine) =>
      pagine.map((altra) => (altra === pagina ? { ...pagina, zone } : altra)),
    );
  }

  protected togliDocumento(nome: string): void {
    this.pagine.update((pagine) => pagine.filter((pagina) => pagina.documento !== nome));
    this.metadati.update(({ [nome]: _, ...altri }) => altri);
  }

  protected togli(pagina: Pagina): void {
    this.pagine.update((pagine) => pagine.filter((altra) => altra !== pagina));
  }

  /** Sposta tutte le pagine di un documento prima o dopo il documento vicino */
  protected sposta({ documento, verso }: { documento: string; verso: -1 | 1 }): void {
    const gruppi = perDocumento(this.pagine());
    const da = gruppi.findIndex((gruppo) => gruppo[0].documento === documento);
    const a = da + verso;
    if (da < 0 || a < 0 || a >= gruppi.length) return;
    [gruppi[da], gruppi[a]] = [gruppi[a], gruppi[da]];
    this.pagine.set(gruppi.flat());
  }
}

/** Due file con lo stesso nome restano due documenti: il secondo diventa «scansione (2)» */
function distinte(nuove: Pagina[], gia: Pagina[]): Pagina[] {
  const usati = new Set(gia.map((pagina) => pagina.documento));
  const nome = nuove[0]?.documento;
  if (!nome || !usati.has(nome)) return nuove;
  let n = 2;
  while (usati.has(`${nome} (${n})`)) n++;
  return nuove.map((pagina) => ({
    ...pagina,
    documento: `${nome} (${n})`,
    nome: pagina.nome.replace(nome, `${nome} (${n})`),
  }));
}

/** La data di oggi nel formato del campo data: «2026-11-12» */
function oggi(): string {
  const adesso = new Date();
  const due = (n: number) => String(n).padStart(2, '0');
  return `${adesso.getFullYear()}-${due(adesso.getMonth() + 1)}-${due(adesso.getDate())}`;
}
