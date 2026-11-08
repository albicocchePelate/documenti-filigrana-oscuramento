import { Component, ElementRef, computed, inject, input, viewChild } from '@angular/core';
import { Metadato } from './metadati';
import { Rete } from './rete';

const CODICE = 'https://github.com/albicocchePelate/documenti-filigrana-oscuramento';

/** «I file restano sul tuo computer · Verifica»: Verifica apre le prove, da controllare da sé. */
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

  private readonly finestra = viewChild.required<ElementRef<HTMLDialogElement>>('finestra');

  protected apri(): void {
    this.finestra().nativeElement.showModal();
  }

  protected chiudi(): void {
    this.finestra().nativeElement.close();
  }

  /** Un clic sullo sfondo, fuori dalla finestra, la chiude */
  protected cliccaSfondo(evento: MouseEvent): void {
    if (evento.target === this.finestra().nativeElement) this.chiudi();
  }
}
