import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';


bootstrapApplication(AppComponent, {
    providers: [
        provideAnimations(),
        provideExperimentalZonelessChangeDetection(),
    ]
})
  .catch(err => console.error(err));
