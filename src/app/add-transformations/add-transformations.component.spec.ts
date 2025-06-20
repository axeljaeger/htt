import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { AddTransformationsComponent } from './add-transformations.component';

import { describe, beforeEach, it, expect } from 'vitest';

describe('AddTransformationsComponent', () => {
  let component: AddTransformationsComponent;
  let fixture: ComponentFixture<AddTransformationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ AddTransformationsComponent ],
      providers: [provideZonelessChangeDetection()]
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
