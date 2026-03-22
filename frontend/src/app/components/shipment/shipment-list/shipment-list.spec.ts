import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipmentList } from './shipment-list';

describe('ShipmentList', () => {
  let component: ShipmentList;
  let fixture: ComponentFixture<ShipmentList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipmentList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShipmentList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
