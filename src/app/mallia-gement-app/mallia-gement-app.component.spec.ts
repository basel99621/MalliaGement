import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MalliaGementAppComponent } from './mallia-gement-app.component';

describe('MalliaGementAppComponent', () => {
  let component: MalliaGementAppComponent;
  let fixture: ComponentFixture<MalliaGementAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MalliaGementAppComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MalliaGementAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
