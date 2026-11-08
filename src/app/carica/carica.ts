import { Component, input, output, signal } from '@angular/core';

/** Grande quando non c'è ancora niente; dopo, una riga con «Aggiungi altri» e «Ricomincia». */
@Component({
  selector: 'app-carica',
  templateUrl: './carica.html',
  styleUrl: './carica.css',
})
export class Carica {
  readonly compatta = input(false);
  readonly documenti = input<{ nome: string; pagine: number }[]>([]);
  readonly caricati = output<File[]>();
  readonly ricomincia = output<void>();
  readonly togliDocumento = output<string>();

  /** Il documento per cui si è chiesto di toglierlo: si aspetta la conferma */
  protected readonly daTogliere = signal<string | null>(null);

  protected readonly sopra = signal(false);

  protected readonly formati =
    'image/jpeg,image/png,image/heic,image/heif,.heic,.heif,application/pdf';

  protected scegli(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    this.consegna(campo.files);
    campo.value = '';
  }

  protected trascina(evento: DragEvent): void {
    evento.preventDefault();
    this.sopra.set(true);
  }

  protected lascia(evento: DragEvent): void {
    evento.preventDefault();
    this.sopra.set(false);
    this.consegna(evento.dataTransfer?.files ?? null);
  }

  private consegna(file: FileList | null): void {
    if (file?.length) this.caricati.emit([...file]);
  }
}
