import { ChangeDetectionStrategy, Component, computed, effect, input, model, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Matrix } from '@babylonjs/core/Maths/math.vector';

import { TransformationEntry } from '../app.component';

export type MatrixElement = 'a11' | 'a21' | 'a12' | 'a22';
export type Dimension = 'x' | 'y';

@Component({
    selector: 'app-matrix',
    hostDirectives: [CdkDrag],
    imports: [DecimalPipe, CdkDragHandle, FormsModule],
    templateUrl: './matrix.component.html',
    styleUrls: ['./matrix.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: MatrixComponent
        }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
      '[style.--accent]': 'color()'
    }
})
export class MatrixComponent implements ControlValueAccessor {
  // Only used for storybook, application uses CVAs
  matrixItem = signal<TransformationEntry>({ transformationType: 'Translation', matrix: Matrix.Identity()});
  affectedDimensions = signal<Dimension[]>(['x']);

  color = input<string>();
  slider = model(0);
  matrix = output<Matrix>();
  deleteMatrix = output<void>();

  prevMatrix = Matrix.Identity();
 
  matrixValue = computed(() => {
    const dimensions = this.affectedDimensions();
    const slider = this.slider();
      switch (this.matrixItem().transformationType) {
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
    
  setVal = effect(() => this.onChange({
    transformationType: this.matrixItem().transformationType, 
    matrix: this.matrixValue()
  }));
  
  clickAffectedDimension(dimension: Dimension, event: MouseEvent) {
    const affectedDimensions = this.affectedDimensions();
    if (affectedDimensions.includes(dimension)) {
      this.affectedDimensions.set(affectedDimensions.filter(d => d !== dimension));
    } else {
      this.affectedDimensions.set([...affectedDimensions, dimension]);
    }
  }

  onChange = (quantity : TransformationEntry) => { };
  formatRotationLabel(value: number): string {
      return `${value}°`;
  }

  writeValue(obj: TransformationEntry): void {
    this.matrixItem.set(obj);
    switch (obj.transformationType) {
      case 'Rotation': {
        const rotationMatrix = obj.matrix.getRotationMatrix();
        const r11 = rotationMatrix.getRow(0).x;
        const r21 = rotationMatrix.getRow(1).x
        this.slider.set(180 * Math.atan2(r21, r11) / Math.PI);
      } break;
      case 'Scaling': {
        const x = obj.matrix.getRow(0).x;
        const y = obj.matrix.getRow(1).y;
        this.slider.set(x);
      } break;
      case 'Translation': {
        const x = obj.matrix.getRow(3).x;
        const y = obj.matrix.getRow(3).y;
        this.slider.set(x);
      } break;
      case 'Shearing': {
        const x = obj.matrix.getRow(0).y;
        const y = obj.matrix.getRow(1).x;
        this.slider.set(x);
      } break;
    }
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    // throw new Error('Method not implemented.');
  }
  setDisabledState?(isDisabled: boolean): void {
    // throw new Error('Method not implemented.');
  }
}
