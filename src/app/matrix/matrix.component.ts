import { ChangeDetectionStrategy, Component, EventEmitter, input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Matrix } from '@babylonjs/core/Maths/math.vector';

import { MatSliderModule } from '@angular/material/slider';
import { TransformationEntry } from '../app.component';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { Angle } from '@babylonjs/core/Maths/math.path';
import { LetDirective } from '@ngrx/component';
import { MatIconModule } from '@angular/material/icon';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { TransformationType } from '../add-transformations/add-transformations.component';


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
    hostDirectives: [CdkDrag],
    imports: [CommonModule, MatSliderModule, ReactiveFormsModule, LetDirective, MatIconModule, CdkDragHandle],
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
    standalone: true
})
export class MatrixComponent implements OnInit, ControlValueAccessor {
  matrixItem = input<TransformationEntry>({ transformationType: TransformationType.Translation, matrix: Matrix.Identity()});

  public MatrixElement = MatrixElement;
  public Dimension = Dimension;

  affectedDimensions$ = new BehaviorSubject<Dimension[]>([Dimension.x]);

  slider = new FormControl(0);

  // combineLatest with affectedDimensions

  prevMatrix = Matrix.Identity();

  @Output() deleteMatrix = new EventEmitter<void>();
  @Output() matrix = combineLatest(
    [ this.slider.valueChanges, 
      this.affectedDimensions$
    ]
  ).pipe(
    map(([slider, dimensions]) => {
      switch (this.matrixItem().transformationType) {
        case 'Translation': {
          const tx = dimensions.includes(Dimension.x) ? slider : this.prevMatrix.getTranslation().x;
          const ty = dimensions.includes(Dimension.y) ? slider : this.prevMatrix.getTranslation().y;
          const newMatrix = Matrix.Translation(tx,ty,0);
          this.prevMatrix = newMatrix
          return newMatrix;
        };

        case 'Rotation': {
          return Matrix.RotationZ(Angle.FromDegrees(slider).radians())
        };

        case 'Scaling': {
          const sx = dimensions.includes(Dimension.x) ? slider : this.prevMatrix.getRow(0).x;
          const sy = dimensions.includes(Dimension.y) ? slider : this.prevMatrix.getRow(1).y;

          const newMatrix = Matrix.Scaling(sx,sy,0);
          this.prevMatrix = newMatrix

          return newMatrix;
        };

        case 'Shearing': {
          const sx = dimensions.includes(Dimension.x) ? slider : this.prevMatrix.getRow(0).y;
          const sy = dimensions.includes(Dimension.y) ? slider : this.prevMatrix.getRow(1).x;

          const newMatrix = Matrix.Identity();
          newMatrix.setRowFromFloats(0, 1, sx, 0, 0);
          newMatrix.setRowFromFloats(1, sy, 1, 0, 0);
          this.prevMatrix = newMatrix
          return newMatrix;
        };

        default:
          return Matrix.Identity();
      }
    })).pipe(startWith(Matrix.Identity()));
  
  
  clickAffectedDimension(dimension: Dimension, event: MouseEvent) {
    const affectedDimensions = this.affectedDimensions$.value;
    if (affectedDimensions.includes(dimension)) {
      this.affectedDimensions$.next(affectedDimensions.filter(d => d !== dimension));
    } else {
      this.affectedDimensions$.next([...affectedDimensions, dimension]);
    }
  }

  onChange = (quantity : TransformationEntry) => { };
  formatRotationLabel(value: number): string {
      return `${value}°`;
  }

  writeValue(obj: TransformationEntry): void {
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

  ngOnInit(): void {    
    this.matrix.subscribe(matrix => {
      const val = {transformationType: this.matrixItem().transformationType, matrix}
      this.onChange(val);
    });
  }
}
