import { Component, input, model } from '@angular/core';

/** Un'opzione: il valore, e come si legge sul pulsante */
export interface Opzione<T> {
  valore: T;
  etichetta: string;
}

/** Poche opzioni affiancate, una sola scelta: come un interruttore. */
@Component({
  selector: 'app-scelta',
  templateUrl: './scelta.html',
  styleUrl: './scelta.css',
})
export class Scelta<T> {
  readonly nome = input.required<string>();
  readonly opzioni = input.required<Opzione<T>[]>();
  readonly valore = model.required<T>();
}
