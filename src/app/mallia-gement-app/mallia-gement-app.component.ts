import { Component } from '@angular/core';
import { Appointment } from '../shared/models/appointment.model';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common'; // ⬅️ nécessaire
import { Practitioner } from '../shared/models/practitioner.model';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PopUpPraticienComponent } from './pop-up-praticien/pop-up-praticien.component';
import { MessageService } from 'primeng/api';



@Component({
  selector: 'app-mallia-gement-app',
  imports: [ ButtonModule, SelectModule, FormsModule, NgIf],
  templateUrl: './mallia-gement-app.component.html',
  styleUrl: './mallia-gement-app.component.scss',
  providers: [DialogService, MessageService]

})
export class MalliaGementAppComponent {

  

selectedPraticien: Practitioner | undefined;

ref: DynamicDialogRef | undefined;
constructor(public dialogService: DialogService, public messageService: MessageService) {}


openPraticienPopUp(){
    this.ref = this.dialogService.open(PopUpPraticienComponent, {
            header: 'Select a Product',
            width: '70%',
            contentStyle: { overflow: 'auto', height:'auto' },
            baseZIndex: 10000,
            data:{
                    ref:this.ref
            }
                
            
        });

        this.ref.onClose.subscribe((product) => {
            if (product) {
                this.messageService.add({ severity: 'info', summary: 'Product Selected', detail: product.name });
            }
        });

}
}