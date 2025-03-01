import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvgGraphicsViewComponent } from './svg-graphics-view.component';

describe('SvgGraphicsViewComponent', () => {
  let component: SvgGraphicsViewComponent;
  let fixture: ComponentFixture<SvgGraphicsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SvgGraphicsViewComponent]
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
