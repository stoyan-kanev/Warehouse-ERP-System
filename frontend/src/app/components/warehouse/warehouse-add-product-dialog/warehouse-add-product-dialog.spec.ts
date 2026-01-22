import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarehouseAddProductDialog } from './warehouse-add-product-dialog';

describe('WarehouseAddProductDialog', () => {
  let component: WarehouseAddProductDialog;
  let fixture: ComponentFixture<WarehouseAddProductDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarehouseAddProductDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarehouseAddProductDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
