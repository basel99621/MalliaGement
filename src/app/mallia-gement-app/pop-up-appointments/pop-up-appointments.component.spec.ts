import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopUpAppointmentsComponent } from './pop-up-appointments.component';

describe('PopUpAppointmentsComponent', () => {
  let component: PopUpAppointmentsComponent;
  let fixture: ComponentFixture<PopUpAppointmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopUpAppointmentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopUpAppointmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
