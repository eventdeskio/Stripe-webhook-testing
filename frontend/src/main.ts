import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
// bootstrapApplication(AppComponent, appConfig)
//   .catch((err) => console.error(err));
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([])),
  ],
}).catch((err) => console.error('Bootstrap failed to initialize:', err));
