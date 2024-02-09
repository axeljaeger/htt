import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Matrix } from '@babylonjs/core/Maths/math.vector';

import { MatSliderModule } from '@angular/material/slider';
import { TransformationEntry } from '../app.component';
import { TransformationType } from '../add-transformations/add-transformations.component';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-matrix',
  standalone: true,
  imports: [CommonModule, MatSliderModule, ReactiveFormsModule],
  templateUrl: './matrix.component.html',
  styleUrls: ['./matrix.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi:true,
      useExisting: MatrixComponent
    }
  ]
})
export class MatrixComponent implements OnInit, ControlValueAccessor {
  onChange = (quantity : TransformationEntry) => { };

  writeValue(obj: TransformationEntry): void {
    this.matrixItem = obj;
    this.slider.setValue(obj.matrix.getTranslation().x);
    this.generateMatrix(obj.matrix.getTranslation().x);
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
    this.slider.valueChanges.subscribe((val) => this.generateMatrix(val));

  }
  @Input() matrixItem: TransformationEntry;
  @Output() matrix = new EventEmitter<Matrix>();

  slider = new FormControl(0);

  generateMatrix(val : number): void {
    let mat : Matrix;
    switch (this.matrixItem.transformationType) {
      case TransformationType.Translation:
        mat = Matrix.Translation(val,0,0);
        break;
      case TransformationType.Scaling:
        mat = Matrix.Scaling(val,val,val);
        break;
      case TransformationType.Rotation:
        mat = Matrix.RotationZ(val / 10.0);
        break;
    }
    this.matrix.emit(mat);
    this.onChange({transformationType: this.matrixItem.transformationType, matrix: mat});
  }
}
