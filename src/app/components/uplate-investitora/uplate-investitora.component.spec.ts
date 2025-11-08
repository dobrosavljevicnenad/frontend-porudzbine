import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UplateInvestitoraComponent } from './uplate-investitora.component';

describe('UplateInvestitoraComponent', () => {
  let component: UplateInvestitoraComponent;
  let fixture: ComponentFixture<UplateInvestitoraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UplateInvestitoraComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UplateInvestitoraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
