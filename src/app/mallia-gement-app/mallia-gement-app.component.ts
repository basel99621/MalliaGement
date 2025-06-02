import { Component, inject, OnInit} from '@angular/core';
import { Appointment } from '../shared/models/appointment.model';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { PractitionnerService } from '../shared/services/practitionner.service';
import { Practitioner } from '../shared/models/practitioner.model';
import { TableModule } from 'primeng/table';
import { NgIf } from '@angular/common';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';


@Component({
  selector: 'app-mallia-gement-app',
  imports: [ ButtonModule, SelectModule, FormsModule, TableModule, NgIf, InputGroupModule, InputGroupAddonModule],
  templateUrl: './mallia-gement-app.component.html',
  styleUrl: './mallia-gement-app.component.scss',
  standalone: true
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

  ngOnInit() {
    this.isLoading = true;
    this.loadMedecins({ first: 0, rows: 5 });
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
}