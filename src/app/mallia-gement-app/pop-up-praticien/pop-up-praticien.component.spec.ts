import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopUpPraticienComponent } from './pop-up-praticien.component';

describe('PopUpPraticienComponent', () => {
  let component: PopUpPraticienComponent;
  let fixture: ComponentFixture<PopUpPraticienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopUpPraticienComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopUpPraticienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
