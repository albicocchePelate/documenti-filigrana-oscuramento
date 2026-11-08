import {
  Component,
  ElementRef,
  computed,
  effect,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ImpostazioniFiligrana, disegnaPagina, fontPronto } from '../filigrana/disegna';
import { Pagina } from '../pagina';
import { Miniatura } from './miniatura';

/** Una pagina alla volta, grande, con sotto le miniature per saltare da una all'altra. */
@Component({
  selector: 'app-anteprima',
  imports: [Miniatura],
  templateUrl: './anteprima.html',
  styleUrl: './anteprima.css',
  // Le frecce sfogliano quando l'anteprima ha il focus: con più file ognuno ha la sua
  host: { tabindex: '0', '(keydown)': 'tasto($event)' },
})
export class Anteprima {
  readonly pagine = input.required<Pagina[]>();
  readonly filigrana = input.required<ImpostazioniFiligrana>();
  readonly togli = output<Pagina>();

  /** La pagina mostrata: resta la stessa quando se ne aggiungono, si sposta se si toglie */
  protected readonly corrente = linkedSignal<Pagina[], number>({
    source: this.pagine,
    computation: (pagine, prima) => Math.max(0, Math.min(prima?.value ?? 0, pagine.length - 1)),
  });
  protected readonly pagina = computed(() => this.pagine()[this.corrente()]);

  /** «busta-paga · pagina 2 di 3» */
  protected readonly didascalia = computed(() => {
    const pagina = this.pagina();
    if (!pagina) return '';
    const stesse = this.pagine().filter((altra) => altra.documento === pagina.documento);
    return stesse.length > 1
      ? `${pagina.documento} · pagina ${stesse.indexOf(pagina) + 1} di ${stesse.length}`
      : pagina.documento;
  });

  /** Chiesto di togliere la pagina: si aspetta la conferma */
  protected readonly confermaTogli = signal(false);
  private attesaConferma?: ReturnType<typeof setTimeout>;

  private readonly grande = viewChild<ElementRef<HTMLCanvasElement>>('grande');
  private readonly fontCaricato = signal(false);

  constructor() {
    fontPronto.then(() => this.fontCaricato.set(true));

    // La pagina grande si ridisegna quando cambia lei o la filigrana
    effect(() => {
      this.fontCaricato();
      const foglio = this.grande()?.nativeElement;
      const pagina = this.pagina();
      if (foglio && pagina) disegnaPagina(foglio, pagina, this.filigrana());
    });
  }

  /** Primo clic: chiede conferma. Se non arriva entro qualche secondo, si torna indietro */
  protected chiediTogli(): void {
    this.confermaTogli.set(true);
    clearTimeout(this.attesaConferma);
    this.attesaConferma = setTimeout(() => this.confermaTogli.set(false), 5000);
  }

  protected confermaTogliPagina(): void {
    clearTimeout(this.attesaConferma);
    this.confermaTogli.set(false);
    this.togli.emit(this.pagine()[this.corrente()]);
  }

  protected vai(passo: number): void {
    this.mostra(this.corrente() + passo);
  }

  /** Cambiare pagina annulla una richiesta di togliere ancora in sospeso */
  protected mostra(indice: number): void {
    this.confermaTogli.set(false);
    this.corrente.set(Math.max(0, Math.min(indice, this.pagine().length - 1)));
  }

  /** Frecce della tastiera per sfogliare, tranne quando si scrive in un campo */
  protected tasto(evento: KeyboardEvent): void {
    if ((evento.target as HTMLElement).closest('input, textarea')) return;
    if (evento.key === 'ArrowLeft') this.vai(-1);
    if (evento.key === 'ArrowRight') this.vai(1);
  }
}
