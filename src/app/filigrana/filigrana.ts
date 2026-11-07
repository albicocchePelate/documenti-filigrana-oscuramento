import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-filigrana',
  templateUrl: './filigrana.html',
  styleUrl: './filigrana.css',
})
export class Filigrana {
  readonly scopo = model.required<string>();
  /** Nel formato del campo data: «2026-11-12» */
  readonly data = model.required<string>();
  readonly testo = input.required<string>();

  protected valore(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }
}
