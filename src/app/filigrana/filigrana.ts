import { DecimalPipe } from '@angular/common';
import { Component, input, model } from '@angular/core';
import { Opzione, Scelta } from '../scelta/scelta';
import { StileFiligrana } from './disegna';

@Component({
  selector: 'app-filigrana',
  imports: [DecimalPipe, Scelta],
  templateUrl: './filigrana.html',
  styleUrl: './filigrana.css',
})
export class Filigrana {
  /** «Solo per affitto via Roma 10» */
  readonly scritta = model.required<string>();
  /** Nel formato del campo data: «2026-11-12» */
  readonly data = model.required<string>();
  readonly stile = model.required<StileFiligrana>();
  readonly testo = input.required<string>();

  protected readonly dimensioni: Opzione<StileFiligrana['dimensione']>[] = [
    { valore: 'piccola', etichetta: 'Piccola' },
    { valore: 'media', etichetta: 'Media' },
    { valore: 'grande', etichetta: 'Grande' },
  ];
  protected readonly colori: Opzione<StileFiligrana['colore']>[] = [
    { valore: 'grigio', etichetta: 'Grigio' },
    { valore: 'rosso', etichetta: 'Rosso' },
    { valore: 'blu', etichetta: 'Blu' },
  ];
  protected readonly fittezze: Opzione<StileFiligrana['fittezza']>[] = [
    { valore: 'rada', etichetta: 'Rada' },
    { valore: 'normale', etichetta: 'Normale' },
    { valore: 'fitta', etichetta: 'Fitta' },
  ];

  /** Cambia una sola caratteristica e lascia le altre come sono */
  protected cambia<K extends keyof StileFiligrana>(chiave: K, valore: StileFiligrana[K]): void {
    this.stile.update((stile) => ({ ...stile, [chiave]: valore }));
  }

  protected valore(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }
}
