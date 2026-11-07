import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-carica',
  templateUrl: './carica.html',
  styleUrl: './carica.css',
})
export class Carica {
  readonly caricati = output<File[]>();

  /** C'è un file trascinato sopra la zona */
  protected readonly sopra = signal(false);

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
