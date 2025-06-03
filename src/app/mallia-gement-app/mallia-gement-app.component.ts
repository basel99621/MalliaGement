import { Component, inject, OnInit} from '@angular/core';
import { Appointment } from '../shared/models/appointment.model';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { PractitionnerService } from '../shared/services/practitionner.service';
import { TableModule } from 'primeng/table';
import { NgIf } from '@angular/common';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { Practitioner } from '../shared/models/practitioner.model';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PopUpPraticienComponent } from './pop-up-praticien/pop-up-praticien.component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FhirService } from '../shared/services/fhir.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { combineLatest } from 'rxjs';
import { PopUpAppointmentsComponent } from './pop-up-appointments/pop-up-appointments.component';

@Component({
  selector: 'app-mallia-gement-app',
  imports: [ButtonModule, SelectModule, FormsModule, TableModule, NgIf, InputGroupModule, InputGroupAddonModule, ToastModule, ConfirmDialogModule],
  templateUrl: './mallia-gement-app.component.html',
  styleUrl: './mallia-gement-app.component.scss',
  standalone: true,
  providers: [DialogService, MessageService, ConfirmationService],

})


export class MalliaGementAppComponent {

  private practitionnerService = inject(PractitionnerService);
  
  isLoading : boolean = false;
  
  allPratitiens: Practitioner[][] = [];
  pratitiens: Practitioner[] = [];
  totalRecords : number = 0;
  searchRPPS: string = '';

  currentPageUrl: string = this.practitionnerService.base + '/Practitioner?_count=5';
  pageUrls: string[] = []; // Pour mémoriser les URLs de chaque page déjà vue

  allPraticiens: Praticien[] = [];
  allOrganistions: Organisation[] = [];
  specialites: any[] = [];
  ref: DynamicDialogRef | undefined;

  constructor(
    public dialogService: DialogService,
    public messageService: MessageService,
    private fhirService: FhirService,
    private confirmationService: ConfirmationService) 
  { }


  ngOnInit() {
    this.isLoading = true;
    this.loadMedecins({ first: 0, rows: 5 });

     combineLatest([
      this.fhirService.getSpecialites(),
      this.fhirService.getOrganisations(),
    ]).subscribe({
      next: ([specialites, organisations]) => {
        // ---- Specialités ----
        this.specialites = specialites?.expansion?.contains ?? [];
        // ---- Organisations ----
        if (Array.isArray(organisations.entry)) {
          this.allOrganistions = organisations.entry.map((org: any) => ({
            id: org.resource.id,
            nom: org.resource.name
          }));
        } else {
          console.error('organisations n\'est pas un tableau :', organisations);
        }
      }
    });
  }

  getRPPS(practicien: Practitioner): string {
    const rpps = practicien.identifier.find(
      (id: any) => id.system == 'https://esante.gouv.fr/produits-services/repertoire-rpps' && !!id.value
    );
    return rpps?.value ?? 'Non spécifié';
  }

  loadMedecins(event: any) {
    let pageNumber : number = Math.floor(event.first / event.rows) + 1;
    const pageIndex :number = pageNumber - 1;

    let url: string | null = this.pageUrls[pageIndex];
    if (!url) {
      url = pageIndex === 0
        ? this.practitionnerService.base + `/Practitioner?_count=${event.rows}`
        : null;
    }

    if (!url) {
      return;
    }

    // si la page a déja été chargée, on l'utilise
    if (this.allPratitiens[pageIndex]) {
      this.pratitiens = this.allPratitiens[pageIndex];
      return;
    }

    // sinon, on charge depuis le back
    this.practitionnerService.getPractitionersByUrl(url).subscribe(response => {
      this.totalRecords = response.total;
      this.allPratitiens[pageIndex] = response.entry;
      this.pratitiens = response.entry;

      const nextUrl = response.links.find((l: any) => l.relation === 'next')?.url;
      const prevUrl = response.links.find((l: any) => l.relation === 'prev')?.url;

      if (nextUrl) this.pageUrls[pageIndex + 1] = nextUrl;
      if (prevUrl) this.pageUrls[pageIndex - 1] = prevUrl;
      this.isLoading = false;
    });
  }

  onSearchRPPS() {
  // on vérifie que c'est bien un RPPS
  /*if (!/^\d{6,}$/.test(this.searchRPPS)) {
    alert("Numéro RPPS invalide.");
    return;
  }*/

  if (this.searchRPPS) {
      this.practitionnerService
        .getByRpps(this.searchRPPS)
        .subscribe(practitioners => {
          this.pratitiens = practitioners;
        });
    } else {
      // si le champ est vide, on recharge la liste initiale
      this.loadMedecins({ first: 0, rows: 5 });
    }
  }

  onInputSearchRPPS() {
    if (!this.searchRPPS) {
      this.loadMedecins({ first: 0, rows: 5 });
    }
  }

  praticienToPractitioner(prat: Praticien): Practitioner {
  return {
    resourceType: 'Practitioner',
    id: prat.id ? prat.id.toString() : Math.floor(Math.random() * 100000).toString(),
    name: {
      family: prat.nom ?? '',
      given: [prat.prenom ?? ''],
    },
    identifier: [],    // ou à remplir si besoin
    telecom: [],       // ou à remplir si besoin
  };
}

  openPraticienPopUp(add: boolean, selectedPraticien? : Practitioner) {
    //Si c'est un ajout d'un nouveau praticien
    if (add) {
      this.ref = this.dialogService.open(PopUpPraticienComponent, {
        header: 'Ajouter un praticien',
        width: '70%',
        contentStyle: { overflow: 'auto', height: 'auto' },
        baseZIndex: 10000,
        closable: true,
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

          //this.allPratitiens.push(newPraticien);
          this.allPratitiens[0].push(this.praticienToPractitioner(newPraticien));
          this.messageService.add({ severity: 'success', summary: 'Success', detail: "Le praticien a été ajouté avec succèss !" });
        } else if (praticien == true) {
          this.messageService.add({ severity: 'errors', summary: 'Error', detail: "Une erreur est survenue !" });
        }

      });
    }
    // Sinon, c'est une mise à jour des informations du praticien
    else {
      //this.selectedPraticienToUpdate = this.allPraticiensWithWithDetails.find((en: any) => en.practitioner.id == this.selectedPraticien?.id)
      this.ref = this.dialogService.open(PopUpPraticienComponent, {
        header: 'Modifier un praticien',
        width: '70%',
        contentStyle: { overflow: 'auto', height: 'auto' },
        baseZIndex: 10000,
        closable: true,
        data: {
          selectedPraticien: selectedPraticien,
          specialites: this.specialites,
          organisations: this.allOrganistions
        }
      });

      this.ref.onClose.subscribe((praticien) => {
        if (praticien) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: "Le praticien a été modifié avec succèss !" });
        } else if (praticien == true) {
          this.messageService.add({ severity: 'errors', summary: 'Error', detail: "Une erreur est survenue !" });
        }
      });
    }


  }

  confirmerSuppression(event: Event, praticien : Praticien) {
    console.log(praticien);
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Souhaitez-vous supprimer le praticien <b> Attention </b>: Tous ses rendez-vous et rôles seront supprimés également.',
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
        if (praticien.id !== undefined) {
          const praticienId = praticien.id;

          this.fhirService.supprimerPraticien(praticienId.toString()).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Succès',
                detail: 'Le praticien a été supprimé avec succès'
              });
              //this.allPratitiens = this.allPratitiens.filter(p => p.id !== praticienId);
              //this.selectedPraticien = null;
              this.allPratitiens = this.allPratitiens.map(pageArray =>
                pageArray.filter(prat => prat.id !== praticienId.toString())
              );

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


openAppointmentsPopUp(praticien: Practitioner) {
    this.ref = this.dialogService.open(PopUpAppointmentsComponent, {
      header: 'Les rendez vous du praticien' ,
      width: '70%',
      contentStyle: { overflow: 'auto', height: 'auto' },
      baseZIndex: 10000,
      closable: true,
      data: {
        selectedPraticien: praticien,
        specialites: this.specialites,
        organisations: this.allOrganistions
      }
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


