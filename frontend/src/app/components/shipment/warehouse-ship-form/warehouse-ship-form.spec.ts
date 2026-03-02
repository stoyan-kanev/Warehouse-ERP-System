import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarehouseShipForm } from './warehouse-ship-form';

describe('WarehouseShipForm', () => {
  let component: WarehouseShipForm;
  let fixture: ComponentFixture<WarehouseShipForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarehouseShipForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarehouseShipForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
