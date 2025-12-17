import { ChangeDetectionStrategy, Component, computed, effect, input, model, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';

import { Matrix } from '@babylonjs/core/Maths/math.vector';

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

  prevMatrix = Matrix.Identity();
 
  matrixValue = computed(() => {
    const dimensions = this.affectedDimensions();
    const slider = this.sliderModel();
      switch (this.value().transformationType) {
        case 'Translation': {
          const tx = dimensions.includes('x') ? slider : this.prevMatrix.getTranslation().x;
          const ty = dimensions.includes('y') ? slider : this.prevMatrix.getTranslation().y;
          const newMatrix = Matrix.Translation(tx,ty,0);
          this.prevMatrix = newMatrix
          return newMatrix;
        };

        case 'Rotation':
          return Matrix.RotationZ(Math.PI * slider / 180);

        case 'Scaling': {
          const sx = dimensions.includes('x') ? slider : this.prevMatrix.getRow(0).x;
          const sy = dimensions.includes('y') ? slider : this.prevMatrix.getRow(1).y;

          const newMatrix = Matrix.Scaling(sx,sy,0);
          this.prevMatrix = newMatrix

          return newMatrix;
        };

        case 'Shearing': {
          const sx = dimensions.includes('x') ? slider : this.prevMatrix.getRow(0).y;
          const sy = dimensions.includes('y') ? slider : this.prevMatrix.getRow(1).x;

          const newMatrix = Matrix.Identity();
          newMatrix.setRowFromFloats(0, 1, sx, 0, 0);
          newMatrix.setRowFromFloats(1, sy, 1, 0, 0);
          this.prevMatrix = newMatrix
          return newMatrix;
        };

        default:
          return Matrix.Identity();
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
        const rotationMatrix = val.matrix.getRotationMatrix();
        const r11 = rotationMatrix.getRow(0).x;
        const r21 = rotationMatrix.getRow(1).x
        
        // this.sliderModel.set(180 * Math.atan2(r21, r11) / Math.PI);
      } break;
      case 'Scaling': {
        const x = val.matrix.getRow(0).x;
        const y = val.matrix.getRow(1).y;
        this.sliderModel.set(x);
      } break;
      case 'Translation': {
        const x = val.matrix.getRow(3).x;
        const y = val.matrix.getRow(3).y;
        this.sliderModel.set(x);
      } break;
      case 'Shearing': {
        const x = val.matrix.getRow(0).y;
        const y = val.matrix.getRow(1).x;
        this.sliderModel.set(x);
      } break;
    }
  });
}
