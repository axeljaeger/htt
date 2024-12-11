import { ChangeDetectionStrategy, Component, computed, effect, input, linkedSignal, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Matrix } from '@babylonjs/core/Maths/math.vector';

import { MatSliderModule } from '@angular/material/slider';
import { TransformationEntry } from '../app.component';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { Angle } from '@babylonjs/core/Maths/math.path';
import { MatIconModule } from '@angular/material/icon';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { TransformationType } from '../add-transformations/add-transformations.component';
import { toSignal } from '@angular/core/rxjs-interop';


enum MatrixElement {
  a11 = 'a11',
  a21 = 'a21',
  a12 = 'a12',
  a22 = 'a22'
}

enum Dimension {
  x,
  y
}

@Component({
  selector: 'app-matrix',
  standalone: true,
  hostDirectives: [CdkDrag],
  imports: [CommonModule, MatSliderModule, ReactiveFormsModule, MatIconModule, CdkDragHandle],
  templateUrl: './matrix.component.html',
  styleUrls: ['./matrix.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi:true,
      useExisting: MatrixComponent
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatrixComponent implements ControlValueAccessor {
  // Mostly used for storybook, actual application uses ControlValueAccessor
  // Rework so that storybook to use form wrapper
  matrixItem = input<TransformationEntry>({ transformationType: TransformationType.Translation, matrix: Matrix.Identity()});
  transformationType = signal<TransformationType>(TransformationType.Translation);

  public MatrixElement = MatrixElement;
  public Dimension = Dimension;

  affectedDimensions = signal<Dimension[]>([Dimension.x]);

  slider = new FormControl(0);
  prevMatrix = Matrix.Identity();
  deleteMatrix = output<void>();
  sliderVal = toSignal(this.slider.valueChanges);

  matrixContent = linkedSignal(() => {
      switch (this.transformationType()) {
        case 'Translation': {
          const tx = this.affectedDimensions().includes(Dimension.x) ? this.sliderVal() : this.prevMatrix.getTranslation().x;
          const ty = this.affectedDimensions().includes(Dimension.y) ? this.sliderVal() : this.prevMatrix.getTranslation().y;
          const newMatrix = Matrix.Translation(tx,ty,0);
          this.prevMatrix = newMatrix;
          return newMatrix;
        };

        case 'Rotation': {
          const newMatrix = Matrix.RotationZ(Angle.FromDegrees(this.sliderVal()).radians());
          this.prevMatrix = newMatrix
          return newMatrix;
        };

        case 'Scaling': {
          const sx = this.affectedDimensions().includes(Dimension.x) ? this.sliderVal() : this.prevMatrix.getRow(0).x;
          const sy = this.affectedDimensions().includes(Dimension.y) ? this.sliderVal() : this.prevMatrix.getRow(1).y;
          const newMatrix = Matrix.Scaling(sx,sy,0);
          this.prevMatrix = newMatrix
          return newMatrix;
        };

        case 'Shearing': {
          const sx = this.affectedDimensions().includes(Dimension.x) ? this.sliderVal() : this.prevMatrix.getRow(0).y;
          const sy = this.affectedDimensions().includes(Dimension.y) ? this.sliderVal() : this.prevMatrix.getRow(1).x;

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

    updateKVA = effect(() => {
      const val = {transformationType: this.matrixItem().transformationType, matrix: this.matrixContent()}
      this.onChange(val);
    });

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
    this.transformationType.set(obj.transformationType);
    this.matrixContent.set(obj.matrix);

    switch (obj.transformationType) {
      case 'Rotation': {
        const rotationMatrix = obj.matrix.getRotationMatrix();
        const r11 = rotationMatrix.getRow(0).x;
        const r21 = rotationMatrix.getRow(1).x
        this.slider.setValue(Angle.FromRadians( Math.atan2(r21, r11)).degrees(), { emitEvent: false });
      } break;
      case 'Scaling': {
        const x = obj.matrix.getRow(0).x;
        const y = obj.matrix.getRow(1).y;
        this.slider.patchValue(x, { emitEvent: false });
      } break;
      case 'Translation': {
        const x = obj.matrix.getRow(3).x;
        const y = obj.matrix.getRow(3).y;
        this.slider.patchValue(x , { emitEvent: false });
      } break;
      case 'Shearing': {
        const x = obj.matrix.getRow(0).y;
        const y = obj.matrix.getRow(1).x;
        this.slider.patchValue(x, { emitEvent: false });
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
