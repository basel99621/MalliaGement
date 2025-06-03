import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { Practitioner } from '../../shared/models/practitioner.model';
import { NgFor, NgIf } from '@angular/common'; // ⬅️ nécessaire
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { FhirService } from '../../shared/services/fhir.service';
import { TableModule } from 'primeng/table';
import { PractitionerRole } from '../../shared/models/practitioner-role.model';
import { MessageService } from 'primeng/api';
import { Organisation } from '../mallia-gement-app.component';



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
  specialties: any[] = [];

  genres: { id: string, name: string }[] = [
    { id: 'male', name: 'Homme' },
    { id: 'female', name: 'Femme' },
    { id: 'outher', name: 'Autre' },
    { id: 'unknown', name: 'Inconnu' }
  ];

  selectedGenre: string | undefined;

  practitionerForm: FormGroup;



  constructor(private fb: FormBuilder, private fhirService: FhirService, private ref: DynamicDialogRef, private messageService: MessageService, private config: DynamicDialogConfig) {
    this.practitionerForm = this.fb.group({
      family: ['', Validators.required],
      given: ['', Validators.required],
      gender: ['male'],  // ou utiliser un select dans le template pour forcer les valeurs attendues
      rpps: ['',
        Validators.required
      ],
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
      roles: this.fb.array([], Validators.required)
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
    console.log(this.config.data.selectedPraticien);

    this.specialties = this.config.data.specialites;
    this.allOrganistions = this.config.data.organisations;
    if (this.config.data.selectedPraticien) {
      const res = this.config.data.selectedPraticien;


      // Extraction des données du Practitioner FHIR
      const name = res.name || {};
      const identifier = res.identifier || [];

      const rpps = identifier.find((id: any) => id.system?.includes('rpps'))?.value || '';
      const matricule = identifier.find((id: any) => id.system?.includes('matricule'))?.value || '';

      // Patch du formulaire
      this.practitionerForm.patchValue({
        family: name.family || '',
        given: name.given?.[0] || '',
        gender: res.gender || 'male',
        rpps: rpps,
        matricule: matricule,
        birthDate: res.birthDate || '',
        city: res.address?.[0]?.city || '',
        postalCode: res.address?.[0]?.postalCode || '',
        country: res.address?.[0]?.country || '',
      });

      // Adresses
      const addressLines = res.address?.[0]?.line || [''];
      this.practitionerForm.setControl('addressLine', this.fb.array(
        addressLines.map((line: string) => this.fb.control(line))
      ));

      // Télécom
      if (res.telecom) {
        const telecomArray = res.telecom.map((t: any) =>
          this.fb.group({
            system: [t.system || ''],
            use: [t.use || ''],
            value: [t.value || '']
          })
        );
        this.practitionerForm.setControl('telecom', this.fb.array(telecomArray));
      }

      // Rôles
      this.fhirService.getRolesByPractitionerId(res.id).subscribe((roles) => {
        this.praticiensRoles = roles;
        console.log(roles);

        if (this.praticiensRoles && Array.isArray(this.praticiensRoles)) {
        const roleControls = this.praticiensRoles.map((role: any) => {
          console.log(role.id);

          const coding = role.code?.[0]?.coding?.[0] || {};
          const organizationRef = role.location[0]?.reference || '';
          const organizationId = organizationRef.split('/')?.[1] || '';
          const speciality: any = this.specialties.find(s => s.code == coding.code);
          return this.fb.group({
            id: role.id,
            serviceStart: [new Date(role.period?.start) || '', Validators.required],
            serviceEnd: [role.period?.end ? new Date(role.period?.end) : role.period?.end || ''],
            specialty: this.fb.group({
              system: [speciality.system || 'https://mos.esante.gouv.fr/NOS/TRE_R32-StatutHospitalier/FHIR/TRE-R32-StatutHospitalier'],
              code: [speciality.code || '', Validators.required],
              display: [speciality.display || '']
            }),
            organizationId: [organizationId, Validators.required]
          });
        });
        this.practitionerForm.setControl('roles', this.fb.array(roleControls));
      }

      });
      
    } else {
      this.ajouterRole();
    }
  }

  closePopUp() {
    this.ref?.close()
  }

  submitForm() {
    if (this.config.data.selectedPraticien) {
      console.log(this.practitionerForm.value);

      this.fhirService.updatePractitionerWithRoles(this.config.data.selectedPraticien.id, this.practitionerForm.value).subscribe(
        (praticien) => {
          console.log(praticien);
          
          this.ref?.close(praticien)

        },
        (error) => {
          console.error(error);
          this.ref?.close(true)
        });

    } else {
      this.fhirService.createPractitionerWithRoles(this.practitionerForm.value).subscribe(
        (praticien) => {
          this.ref?.close(praticien);
        },
        (error) => {
          console.error(error);
          this.ref?.close(true)
        });
    }
  }

  ajouterRole(): void {
    const nouveauRole = this.fb.group({
      serviceStart: ['', Validators.required],
      serviceEnd: [''],
      specialty: this.fb.group({
        system: ['https://mos.esante.gouv.fr/NOS/TRE_R32-StatutHospitalier/FHIR/TRE-R32-StatutHospitalier'],  // valeur par défaut
        code: ['', Validators.required],
        display: ['']
      }),
      organizationId: ['', Validators.required]
    });

    this.roles.push(nouveauRole);
  }

  removeRole(index: number): void {
    if (this.roles.length > 1) {
      this.roles.removeAt(index);
    }
  }
}



