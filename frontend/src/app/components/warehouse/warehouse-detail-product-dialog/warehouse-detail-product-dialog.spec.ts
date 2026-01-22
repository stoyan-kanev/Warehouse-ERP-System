import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarehouseDetailProductDialog } from './warehouse-detail-product-dialog';

describe('WarehouseDetailProductDialog', () => {
  let component: WarehouseDetailProductDialog;
  let fixture: ComponentFixture<WarehouseDetailProductDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarehouseDetailProductDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarehouseDetailProductDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
