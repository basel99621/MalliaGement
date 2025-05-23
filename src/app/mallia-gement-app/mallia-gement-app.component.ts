import { Component } from '@angular/core';
import { Practitioner } from '../shared/models/practitionner.model';
import { Appointment } from '../shared/models/appointment.model';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common'; // ⬅️ nécessaire


@Component({
  selector: 'app-mallia-gement-app',
  imports: [ ButtonModule, SelectModule, FormsModule, NgIf],
  templateUrl: './mallia-gement-app.component.html',
  styleUrl: './mallia-gement-app.component.scss'
})
export class MalliaGementAppComponent {

  praticiens: Practitioner [] =  [
  { id: 1, nom: 'Dr. Martin Dupuis', spécialité: 'Cardiologue', email: 'martin.dupuis@hopital.fr' },
  { id: 2, nom: 'Dr. Sophie Bernard', spécialité: 'Dermatologue', email: 'sophie.bernard@hopital.fr' },
  { id: 3, nom: 'Dr. Julien Fabre', spécialité: 'Pédiatre', email: 'julien.fabre@hopital.fr' },
];

selectedPraticien: Practitioner | undefined;

appointments: Appointment []  = [
  { id: 1, praticienId: 1, date: '2025-05-21', heure: '09:00', patient: 'Alice Morel' },
  { id: 2, praticienId: 1, date: '2025-05-21', heure: '10:00', patient: 'Bruno Delmas' },
  { id: 3, praticienId: 1, date: '2025-05-21', heure: '11:00', patient: 'Claire Petit' },

  { id: 4, praticienId: 2, date: '2025-05-21', heure: '09:30', patient: 'David Lopez' },
  { id: 5, praticienId: 2, date: '2025-05-21', heure: '10:30', patient: 'Emma Chevalier' },
  { id: 6, praticienId: 2, date: '2025-05-21', heure: '11:30', patient: 'Fabrice Marchal' },

  { id: 7, praticienId: 3, date: '2025-05-21', heure: '08:45', patient: 'Gabriel Roussel' },
  { id: 8, praticienId: 3, date: '2025-05-21', heure: '09:45', patient: 'Hélène Caron' },
  { id: 9, praticienId: 3, date: '2025-05-21', heure: '10:45', patient: 'Isabelle Granger' },
];


test(event:any)
{
  this.selectedPraticien = event.value
console.log(this.selectedPraticien);

}
}