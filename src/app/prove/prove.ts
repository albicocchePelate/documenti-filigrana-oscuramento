import { Component, computed, inject, input } from '@angular/core';
import { Metadato } from './metadati';
import { Rete } from './rete';

const CODICE = 'https://github.com/albicocchePelate/documenti-filigrana-oscuramento';

/** «Come verifico che i file non escono dal computer?»: le prove, da controllare da sé. */
@Component({
  selector: 'app-prove',
  templateUrl: './prove.html',
  styleUrl: './prove.css',
})
export class Prove {
  /** Per ogni documento caricato, cosa conteneva oltre al documento */
  readonly metadati = input<Record<string, Metadato[]>>({});

  protected readonly rete = inject(Rete);
  protected readonly codice = CODICE;
  protected readonly documenti = computed(() => Object.entries(this.metadati()));
}
