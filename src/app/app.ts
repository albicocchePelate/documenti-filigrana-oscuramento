import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Anteprima } from './anteprima/anteprima';
import { Carica } from './carica/carica';
import { formato, leggiFile } from './carica/leggi';
import { PdfProtetto } from './carica/leggi-pdf';
import { ImpostazioniFiligrana, testoFiligrana } from './filigrana/disegna';
import { Filigrana } from './filigrana/filigrana';
import { Pagina } from './pagina';
import { Scarica } from './scarica/scarica';

const INIZIO = 'Solo per ';

@Component({
  selector: 'app-root',
  imports: [Anteprima, Carica, Filigrana, NgTemplateOutlet, Scarica],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly pagine = signal<Pagina[]>([]);
  /** Si parte da «Solo per »: di solito basta completarla */
  protected readonly scritta = signal(INIZIO);
  protected readonly data = signal(oggi());
  protected readonly visibilita = signal(0.38);
  /** Cosa si sta leggendo adesso, mentre i file arrivano */
  protected readonly lettura = signal('');
  protected readonly errori = signal<string[]>([]);

  /** Finché la scritta non è completata l'anteprima mostra «Solo per …», così si vede l'effetto */
  protected readonly testo = computed(() =>
    testoFiligrana(this.completata() ? this.scritta() : `${INIZIO}…`, this.data()),
  );
  protected readonly filigrana = computed<ImpostazioniFiligrana>(() => ({
    testo: this.testo(),
    visibilita: this.visibilita(),
  }));
  protected readonly completata = computed(() => {
    const scritta = this.scritta().trim();
    return scritta.length > 0 && scritta !== INIZIO.trim();
  });

  /** «3 pagine da 2 file» */
  protected readonly riepilogo = computed(() => {
    const pagine = this.pagine().length;
    const file = new Set(this.pagine().map((pagina) => pagina.documento)).size;
    const quante = pagine === 1 ? '1 pagina' : `${pagine} pagine`;
    return file > 1 ? `${quante} da ${file} file` : quante;
  });

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
    this.errori.set([]);
  }

  protected togli(indice: number): void {
    this.pagine.update((pagine) => pagine.filter((_, i) => i !== indice));
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
