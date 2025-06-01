import { Component } from '@angular/core';
import { Appointment } from '../shared/models/appointment.model';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common'; // ⬅️ nécessaire
import { Practitioner } from '../shared/models/practitioner.model';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PopUpPraticienComponent } from './pop-up-praticien/pop-up-praticien.component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FhirService, PractitionerWithRoleInput } from '../shared/services/practitionner.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PractitionerRole } from '../shared/models/practitioner-role.model';

@Component({
  selector: 'app-mallia-gement-app',
  imports: [ButtonModule, SelectModule, FormsModule, NgIf, ToastModule, ConfirmDialogModule],
  templateUrl: './mallia-gement-app.component.html',
  styleUrl: './mallia-gement-app.component.scss',
  providers: [DialogService, MessageService, ConfirmationService],

})
export class MalliaGementAppComponent {



  selectedPraticien: Praticien | undefined | null;

  selectedPraticienToUpdate: Practitioner | undefined;

  allOrganistions: Organisation[] = [];

  ref: DynamicDialogRef | undefined;
  allPraticiens: Praticien[] = [];

  allPraticiensWithWithDetails: any[] = [];

  allPraticiensRole: PraticienRole[] = [];

  specialites: any[] = [];

  constructor(public dialogService: DialogService,
    public messageService: MessageService,
    private fhirService: FhirService,
    private confirmationService: ConfirmationService) { }

  ngOnInit() {


    this.fhirService.getSpecialites().subscribe(specialites => {
      this.specialites = specialites.expansion.contains;
    });

    this.fhirService.getOrganisations().subscribe(organisations => {
      if (Array.isArray(organisations.entry)) {
        organisations.entry.forEach((org: any) => {
          const organisation: Organisation = {
            id: org.resource.id,
            nom: org.resource.name
          };
          this.allOrganistions.push(organisation)
        });
      } else {
        console.error('organisations n\'est pas un tableau :', organisations);
      }
    });
    this.fhirService.getAllPracticiensWithDetails().subscribe(praticiens => {



      if (Array.isArray(praticiens)) {
        this.allPraticiensWithWithDetails = praticiens;

        praticiens.forEach((pr: any) => {
          let praticien: Praticien = new Praticien({
            id: pr.practitioner.id,
            nom: pr.practitioner.name[0].family,
            prenom: pr.practitioner.name[0].given[0],
          })
          this.allPraticiens.push(praticien);
        });

      } else {
        console.error('organisations n\'est pas un tableau :', praticiens);
      }
    });

    this.fhirService.getAllPraticiensRole().subscribe(praticiensRole => {
      if (Array.isArray(praticiensRole.entry)) {

        praticiensRole.entry.forEach((pR: any) => {
          let praticienRole: PraticienRole = new PraticienRole({
            id: pR.resource.id,
            praticientId: pR.resource.practitioner.reference.split('/')[1]
          })
          this.allPraticiensRole.push(praticienRole);


        });
      } else {
        console.error('organisations n\'est pas un tableau :', praticiensRole);
      }
    });
  }


  openPraticienPopUp(add: boolean) {
    if (add) {
      this.ref = this.dialogService.open(PopUpPraticienComponent, {
        header: 'Ajouter un praticien',
        width: '90%',
        contentStyle: { overflow: 'auto', height: 'auto' },
        baseZIndex: 10000,
        data: {
          specialites: this.specialites,
          organisations: this.allOrganistions
        }
      });

      this.ref.onClose.subscribe((praticien) => {

        if (praticien) {
          let newPraticien: Praticien = new Praticien({
            id: praticien.practitioner.id,
            nom: praticien.practitioner.name[0].family,
            prenom: praticien.practitioner.name[0].given[0],
          });


          this.allPraticiens.push(newPraticien);

          this.messageService.add({ severity: 'success', summary: 'Success', detail: "Le praticien a été ajouté avec succèss !" });
        } else if (praticien == true) {
          this.messageService.add({ severity: 'errors', summary: 'Error', detail: "Une erreur est survenue !" });
        }

      });
    } else {
      this.selectedPraticienToUpdate = this.allPraticiensWithWithDetails.find((en: any) => en.practitioner.id == this.selectedPraticien?.id)
      this.ref = this.dialogService.open(PopUpPraticienComponent, {
        header: 'Modifier un praticien',
        width: '70%',
        contentStyle: { overflow: 'auto', height: 'auto' },
        baseZIndex: 10000,
        data: {
          selectedPraticien: this.selectedPraticienToUpdate,
          specialites: this.specialites,
          organisations: this.allOrganistions
        }
      });

      this.ref.onClose.subscribe((praticien) => {
        if (praticien) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: "Le praticien a été ajouté avec succèss !" });
        } else if (praticien == true) {
          this.messageService.add({ severity: 'errors', summary: 'Error', detail: "Une erreur est survenue !" });
        }
      });
    }


  }

  confirm1(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Souhaitez-vous supprimer le praticien <b>' + this.selectedPraticien?.getNomPrenom() + "</b> ?" + "</br>" + "<b>Attention </b>: Tous ses rendez-vous et rôles seront supprimés également.",
      header: 'Confirmation',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Annuler',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Valider',
      },
      accept: () => {
        if (this.selectedPraticien?.id !== undefined) {
          const praticienId = this.selectedPraticien.id;
          
          this.fhirService.supprimerPraticienAvecRelations(praticienId.toString()).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Succès',
                detail: 'Le praticien a été supprimé avec succès'
              });
              this.allPraticiens = this.allPraticiens.filter(p => p.id !== praticienId);
              this.selectedPraticien = null;
            },
            error: (error) => {
              console.error('Erreur lors de la suppression du praticien :', error);

              this.messageService.add({
                severity: 'error',
                summary: 'Échec',
                detail: 'Erreur pendant la suppression du praticien'
              });
            }
          });

        }
      },
      reject: () => {

      },
    });
  }
}

export class Praticien {
  id: number | undefined;
  nom: string | undefined;
  prenom: string | undefined;
  constructor(init: Partial<Praticien>) {
    Object.assign(this, init);
  }

  getNomPrenom(): string {
    return `${this.nom ?? ''} ${this.prenom ?? ''}`.trim();
  }

}

export class PraticienRole {
  id: number | undefined;
  praticientId: number | undefined;

  constructor(init: Partial<PraticienRole>) {
    Object.assign(this, init);
  }

}

export class Organisation {
  id: number | undefined;
  nom: string | undefined;
  constructor(init: Partial<Organisation>) {
    Object.assign(this, init);
  }
}


