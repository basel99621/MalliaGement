import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { Practitioner } from '../../shared/models/practitioner.model';
import { NgIf } from '@angular/common'; // ⬅️ nécessaire
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-pop-up-praticien',
  imports: [InputTextModule,FormsModule, NgIf, DatePickerModule, SelectModule, ButtonModule],
  templateUrl: './pop-up-praticien.component.html',
  styleUrl: './pop-up-praticien.component.scss',
})
export class PopUpPraticienComponent {
  practionner: Practitioner | undefined
  rpps: string | undefined
  dateNaissance: Date | undefined
 genres: { id: string, name: string }[] = [
  { id: 'homme', name: 'Homme' },
  { id: 'femme', name: 'Femme' },
  { id: 'autre', name: 'Autre' },
  { id: 'inconnu', name: 'Inconnu' }
];

  selectedGenre: string | undefined

}
