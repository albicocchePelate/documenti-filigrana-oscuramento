import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { precarica } from './app/carica/precarica';

bootstrapApplication(App, appConfig)
  .then(precarica)
  .catch((errore) => console.error(errore));
