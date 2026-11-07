import { Component, computed, signal } from '@angular/core';
import { Anteprima } from './anteprima/anteprima';
import { Carica } from './carica/carica';
import { formato, leggiFile } from './carica/leggi';
import { PdfProtetto } from './carica/leggi-pdf';
import { testoFiligrana } from './filigrana/disegna';
import { Filigrana } from './filigrana/filigrana';
import { Pagina } from './pagina';
import { Scarica } from './scarica/scarica';

@Component({
  selector: 'app-root',
  imports: [Anteprima, Carica, Filigrana, Scarica],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly pagine = signal<Pagina[]>([]);
  protected readonly scopo = signal('');
  protected readonly data = signal(oggi());
  /** Cosa si sta leggendo adesso, mentre i file arrivano */
  protected readonly lettura = signal('');
  protected readonly errori = signal<string[]>([]);

  /** Finché lo scopo è vuoto l'anteprima mostra «Solo per …», così si vede l'effetto */
  protected readonly testo = computed(() => testoFiligrana(this.scopo() || '…', this.data()));
  protected readonly pronto = computed(() => this.scopo().trim().length > 0);

  protected async aggiungi(file: File[]): Promise<void> {
    const errori: string[] = [];
    for (const uno of file) {
      if (!formato(uno)) {
        errori.push(`«${uno.name}»: questo formato non lo leggo. Vanno bene JPG, PNG, HEIC e PDF.`);
        continue;
      }
      this.lettura.set(`Leggo «${uno.name}»…`);
      try {
        const nuove = await leggiFile(uno, (testo) => this.lettura.set(testo));
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

  protected togli(indice: number): void {
    this.pagine.update((pagine) => pagine.filter((_, i) => i !== indice));
  }
}

/** La data di oggi nel formato del campo data: «2026-11-12» */
function oggi(): string {
  const adesso = new Date();
  const due = (n: number) => String(n).padStart(2, '0');
  return `${adesso.getFullYear()}-${due(adesso.getMonth() + 1)}-${due(adesso.getDate())}`;
}
