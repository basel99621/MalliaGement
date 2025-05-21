import { Routes } from '@angular/router';
import { MalliaGementAppComponent } from './mallia-gement-app/mallia-gement-app.component';

export const routes: Routes = [
  { path: '', redirectTo: 'praticiens', pathMatch: 'full' }, // route par défaut
  { path: 'praticiens', component: MalliaGementAppComponent }
];
