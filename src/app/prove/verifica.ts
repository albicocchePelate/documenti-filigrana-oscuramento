import { Injectable, signal } from '@angular/core';

/** Per aprire la finestra Verifica da un altro punto della pagina, sui dati di certi documenti */
@Injectable({ providedIn: 'root' })
export class Verifica {
  /** I documenti da mettere in evidenza; null quando nessuno ha chiesto niente */
  readonly richiesta = signal<string[] | null>(null);

  mostra(documenti: string[]): void {
    this.richiesta.set(documenti);
  }
}
