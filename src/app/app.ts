import { Component, computed, signal } from '@angular/core';
import { Anteprima } from './anteprima/anteprima';
import { Carica } from './carica/carica';
import { formatoLeggibile, leggiImmagine } from './carica/leggi-immagine';
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
  protected readonly errore = signal('');

  /** Finché lo scopo è vuoto l'anteprima mostra «Solo per …», così si vede l'effetto */
  protected readonly testo = computed(() => testoFiligrana(this.scopo() || '…', this.data()));
  protected readonly pronto = computed(() => this.scopo().trim().length > 0);

  protected async aggiungi(file: File[]): Promise<void> {
    const leggibili = file.filter(formatoLeggibile);
    const scartati = file.length - leggibili.length;
    this.errore.set(
      scartati
        ? `${scartati === 1 ? 'Un file' : `${scartati} file`} non li leggo: per ora solo JPG e PNG.`
        : '',
    );
    const nuove = await Promise.all(leggibili.map(leggiImmagine));
    this.pagine.update((pagine) => [...pagine, ...nuove]);
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
