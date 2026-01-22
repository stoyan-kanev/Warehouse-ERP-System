import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarehouseCreation } from './warehouse-creation';

describe('WarehouseCreation', () => {
  let component: WarehouseCreation;
  let fixture: ComponentFixture<WarehouseCreation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarehouseCreation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarehouseCreation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
