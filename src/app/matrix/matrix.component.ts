import { ChangeDetectionStrategy, Component, computed, effect, input, model, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';

import { TransformationEntry } from '../app.component';
import { FormValueControl } from '@angular/forms/signals';

export type MatrixElement = 'a11' | 'a21' | 'a12' | 'a22';
export type Dimension = 'x' | 'y';

@Component({
    selector: 'app-matrix',
    hostDirectives: [CdkDrag],
    imports: [DecimalPipe, CdkDragHandle],
    templateUrl: './matrix.component.html',
    styleUrls: ['./matrix.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
      '[style.--accent]': 'color()'
    }
})
export class MatrixComponent implements FormValueControl<TransformationEntry> {
  value = model<TransformationEntry>();
  color = input<string>();
  deleteMatrix = output<void>();

  affectedDimensions = signal<Dimension[]>(['x']);  
  sliderModel = signal(0);
  
  formConstraints = computed(() => this.value().transformationType === 'Rotation' ? {
    min: -360,
    max: 360,
    step: 1
  } : {
    min: -10,
    max: 10,
    step: 0.1
  });

  prevMatrix = new DOMMatrix();
 
  matrixValue = computed(() => {
    const dimensions = this.affectedDimensions();
    const slider = this.sliderModel();
      switch (this.value().transformationType) {
        case 'Translation': {
          const tx = dimensions.includes('x') ? slider : this.prevMatrix.m41;
          const ty = dimensions.includes('y') ? slider : this.prevMatrix.m42;
          const newMatrix = new DOMMatrix().translate(tx,ty,0);
          this.prevMatrix = newMatrix
          return newMatrix;
        };

        case 'Rotation':
          return new DOMMatrix().rotateSelf(0,0, slider);

        case 'Scaling': {
          const sx = dimensions.includes('x') ? slider : this.prevMatrix.m11;
          const sy = dimensions.includes('y') ? slider : this.prevMatrix.m22;

          const newMatrix = new DOMMatrix().scale(sx,sy,0);
          this.prevMatrix = newMatrix

          return newMatrix;
        };
 
        case 'Shearing': {
          // might be the reason for problem with shearing
          const sx = dimensions.includes('x') ? slider : this.prevMatrix.m12;
          const sy = dimensions.includes('y') ? slider : this.prevMatrix.m21;

          const newMatrix = new DOMMatrix().skewX(sx).skewY(sy);
          this.prevMatrix = newMatrix
          return newMatrix;
        };

        default:
          return new DOMMatrix();
      }
    });
  
  updateValueFromSlider(val: number) {
    this.sliderModel.set(val);
        this.value.update(entry => ({
    ...entry, 
    matrix: this.matrixValue()
    }));
  }

  clickAffectedDimension(dimension: Dimension) {
    const affectedDimensions = this.affectedDimensions();
    if (affectedDimensions.includes(dimension)) {
      this.affectedDimensions.set(affectedDimensions.filter(d => d !== dimension));
    } else {
      this.affectedDimensions.set([...affectedDimensions, dimension]);
    }
  }

  // This is to update the slider.
  // only call this from when the input model changes.
  // bail out if the change was caused by the slider itself.
  writeValue = effect(() => {
    const val = this.value();
    switch (this.value().transformationType) {
      case 'Rotation': {
        const r11 = val.matrix.m11;
        const r21 = val.matrix.m21;        
        // this.sliderModel.set(180 * Math.atan2(r21, r11) / Math.PI);
      } break;
      case 'Scaling': {
        const x = val.matrix.m11;
        const y = val.matrix.m22;
        this.sliderModel.set(x);
      } break;
      case 'Translation': {
        const x = val.matrix.m41;
        const y = val.matrix.m42;
        this.sliderModel.set(x);
      } break;
      case 'Shearing': {
        const x = val.matrix.m12;
        const y = val.matrix.m21;
        this.sliderModel.set(x);
      } break;
    }
  });
}
