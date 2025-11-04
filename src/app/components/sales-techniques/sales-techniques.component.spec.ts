import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesTechniquesComponent } from './sales-techniques.component';

describe('SalesTechniquesComponent', () => {
  let component: SalesTechniquesComponent;
  let fixture: ComponentFixture<SalesTechniquesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesTechniquesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SalesTechniquesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
