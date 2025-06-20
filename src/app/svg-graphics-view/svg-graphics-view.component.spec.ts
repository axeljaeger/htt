import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';


import { SvgGraphicsViewComponent } from './svg-graphics-view.component';

import { describe, beforeEach, it, expect } from 'vitest';

describe('SvgGraphicsViewComponent', () => {
  let component: SvgGraphicsViewComponent;
  let fixture: ComponentFixture<SvgGraphicsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SvgGraphicsViewComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SvgGraphicsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
