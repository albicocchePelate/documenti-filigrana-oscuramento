import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { Metadato } from './metadati';
import { Rete } from './rete';
import { Verifica } from './verifica';

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

  /** I documenti di cui si è chiesto di vedere i dati, dal pulsante «Vedi quali» */
  protected readonly evidenziati = signal<string[]>([]);

  private readonly finestra = viewChild.required<ElementRef<HTMLDialogElement>>('finestra');
  private readonly verifica = inject(Verifica);
  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      const documenti = this.verifica.richiesta();
      if (!documenti) return;
      this.verifica.richiesta.set(null);
      this.evidenziati.set(documenti);
      this.apri();
      afterNextRender(
        () =>
          this.finestra()
            .nativeElement.querySelector('.file.evidenziato')
            ?.scrollIntoView({ block: 'center' }),
        { injector: this.injector },
      );
    });
  }

  protected apri(): void {
    this.finestra().nativeElement.showModal();
  }

  protected chiudi(): void {
    this.finestra().nativeElement.close();
    this.evidenziati.set([]);
  }

  /** Un clic sullo sfondo, fuori dalla finestra, la chiude */
  protected cliccaSfondo(evento: MouseEvent): void {
    if (evento.target === this.finestra().nativeElement) this.chiudi();
  }
}
