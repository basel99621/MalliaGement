import { Component } from '@angular/core';
import { FhirService } from '../../shared/services/fhir.service';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { NgIf } from '@angular/common'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pop-up-appointments',
  imports: [TableModule, NgIf, CommonModule],
  templateUrl: './pop-up-appointments.component.html',
  styleUrl: './pop-up-appointments.component.scss'
})
export class PopUpAppointmentsComponent {
  appointments: Appointment[] = [];
  isLoading: boolean = false;

  constructor(private fhirService: FhirService, private config: DynamicDialogConfig) { }

  ngOnInit() {
    this.isLoading = true;
    this.fhirService.getAppointmentsWithPatientsByPractitionerId(this.config.data.selectedPraticien.id?.toString()).subscribe(appointmentWithPatientList => {
      this.appointments = appointmentWithPatientList.map(ap => {
        const patient = ap.patient;
        const appointment = ap.appointment;

        return {
          nomPatient: patient?.name?.[0]?.family || '',
          prenomPatient: patient?.name?.[0]?.given?.[0] || '',
          date: new Date(appointment.start),
          dateNaissance: new Date(patient?.birthDate),
          motif: appointment.description || ''
        };
      });
      this.isLoading = false;
    });
  }



}

interface Appointment {
  nomPatient: string;
  prenomPatient: string;
  date: Date;
  dateNaissance: Date
  motif: string;

}
