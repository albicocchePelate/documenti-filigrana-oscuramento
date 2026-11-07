import { DecimalPipe } from '@angular/common';
import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-filigrana',
  imports: [DecimalPipe],
  templateUrl: './filigrana.html',
  styleUrl: './filigrana.css',
})
export class Filigrana {
  /** «Solo per affitto via Roma 10» */
  readonly scritta = model.required<string>();
  /** Nel formato del campo data: «2026-11-12» */
  readonly data = model.required<string>();
  /** Da 0 a 1 */
  readonly visibilita = model.required<number>();
  readonly testo = input.required<string>();

  protected valore(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }
}
