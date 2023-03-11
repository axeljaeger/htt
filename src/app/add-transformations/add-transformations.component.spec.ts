import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTransformationsComponent } from './add-transformations.component';

describe('AddTransformationsComponent', () => {
  let component: AddTransformationsComponent;
  let fixture: ComponentFixture<AddTransformationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ AddTransformationsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTransformationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
