import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { Practitioner } from '../../shared/models/practitioner.model';
import { NgFor, NgIf } from '@angular/common'; // ⬅️ nécessaire
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { FhirService } from '../../shared/services/practitionner.service';
import { TableModule } from 'primeng/table';
import { PractitionerRole } from '../../shared/models/practitioner-role.model';



@Component({
  selector: 'app-pop-up-praticien',
  imports: [TableModule, ReactiveFormsModule, InputTextModule, FormsModule, NgFor, NgIf, DatePickerModule, SelectModule, ButtonModule],
  templateUrl: './pop-up-praticien.component.html',
  styleUrl: './pop-up-praticien.component.scss',
})
export class PopUpPraticienComponent {
  practionner: Practitioner | undefined
  rpps: string | undefined
  dateNaissance: Date | undefined;
  allOrganistions: Organisation[] = [];
  praticiensRoles: PractitionerRole[] = [];

  genres: { id: string, name: string }[] = [
    { id: 'homme', name: 'Homme' },
    { id: 'femme', name: 'Femme' },
    { id: 'autre', name: 'Autre' },
    { id: 'inconnu', name: 'Inconnu' }
  ];

  selectedGenre: string | undefined;

  practitionerForm: FormGroup;

  specialites: any [] = [];


  constructor(private fb: FormBuilder, private fhirService: FhirService, private ref: DynamicDialogRef ) {
    this.practitionerForm = this.fb.group({
      family: ['', Validators.required],
      given: ['', Validators.required],
      gender: ['male'],  // ou utiliser un select dans le template pour forcer les valeurs attendues
      rpps: ['',  Validators.required],
      matricule: [''],
      birthDate: [''],
      addressLine: this.fb.array([this.fb.control('')]),
      city: [''],
      postalCode: [''],
      country: [''],
      telecom: this.fb.array([
        this.fb.group({
          system: ['email'],  // 'email' ou 'phone'
          use: ['work'],      // 'work' ou 'home'
          value: ['']
        }),
        this.fb.group({
          system: ['phone'],
          use: ['work'],
          value: ['']
        })
      ]),
      photoBase64: [''],
      roles: this.fb.array([
        this.fb.group({
          serviceStart: [''],
          serviceEnd: [''],
          specialty: this.fb.group({
            system: [''],  // ex : 'http://snomed.info/sct'
            code: [''],    // ex : '408443003'
            display: ['']  // ex : 'Généraliste'
          }),
          organizationId: ['']
        })
      ])
    });
  }

  // Getters pratiques pour le template
  get addressLine(): FormArray {
    return this.practitionerForm.get('addressLine') as FormArray;
  }

  get telecom(): FormArray {
    return this.practitionerForm.get('telecom') as FormArray;
  }

  get roles(): FormArray {
    return this.practitionerForm.get('roles') as FormArray;
  }
  ngOnInit() {
    this.fhirService.getOrganisations().subscribe(organisations => {
      if (Array.isArray(organisations.entry)) {
        organisations.entry.forEach((org: any) => {
          const organisation: Organisation = {
            id: org.resource.id,
            nom: org.resource.name
          };
          this.allOrganistions.push(organisation)
        });
        console.log(this.allOrganistions);

      } else {
        console.error('organisations n\'est pas un tableau :', organisations);
      }


    })

    this.fhirService.getSpecialites().subscribe(specialites => {
      specialites.expansion.contains.forEach((spe: any )=> { 
        this.specialites.push(spe);
      });;
      console.log(this.specialites);
      
    })
  }


  closePopUp() {
    this.ref?.close()
  }
  submitForm() {
    console.log(this.practitionerForm);
    this.fhirService.createPractitionerWithRoles(this.practitionerForm.value).subscribe(
      praticien => {
        console.log(praticien);

      },
      (error) => {
        console.error(error);

      }
    )


  }
  ajouterRole(): void {
  const nouveauRole = this.fb.group({
    serviceStart: [''],
    serviceEnd: [''],
    specialty: this.fb.group({
      system: 'http://snomed.info/sct',  // valeur par défaut
      code: [''],
      display: ['']
    }),
    organizationId: ['']
  });

  this.roles.push(nouveauRole);
}

removeRole(index: number): void {
  this.roles.removeAt(index);
}


}

export class Organisation {
  id: number | undefined;
  nom: string | undefined;
  constructor(init: Partial<Organisation>) {
    Object.assign(this, init);
  }
}


