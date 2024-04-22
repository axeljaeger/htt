import { Component, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Matrix } from '@babylonjs/core/Maths/math.vector';

import { MatSliderModule } from '@angular/material/slider';
import { TransformationEntry } from '../app.component';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { map } from 'rxjs/operators';
import { merge } from 'rxjs';

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
  @Input() matrixItem: TransformationEntry;

  rotation = new FormControl(0);

  scaling = new FormGroup({
    x: new FormControl(0),
    y: new FormControl(0)
  })

  translation = new FormGroup({
    x: new FormControl(0),
    y: new FormControl(0) 
  })
  
  rotation$ = this.rotation.valueChanges.pipe(map(number => Matrix.RotationZ(number)));
  translation$ = this.translation.valueChanges.pipe(map(({x,y}) => Matrix.Translation(x,y,0)));
  scaling$ = this.scaling.valueChanges.pipe(map(({x,y}) => Matrix.Scaling(x,y,0)));

  @Output() matrix = merge(this.rotation$, this.translation$, this.scaling$);

  onChange = (quantity : TransformationEntry) => { };

  writeValue(obj: TransformationEntry): void {
    this.matrixItem = obj;
    switch (obj.transformationType) {
      case 'Rotation': {
        const rotationMatrix = obj.matrix.getRotationMatrix();
        const r11 = rotationMatrix.getRow(0).x;
        const r21 = rotationMatrix.getRow(1).x
        this.rotation.setValue(Math.atan2(r21, r11), { emitEvent: false });
      } break;
      case 'Scaling': {
        const x = obj.matrix.getRow(0).x;
        const y = obj.matrix.getRow(1).y;
        this.scaling.patchValue({ x, y }, { emitEvent: false });
      } break;

      case 'Translation': {
        const x = obj.matrix.getRow(3).x;
        const y = obj.matrix.getRow(3).y;
        this.translation.patchValue({ x, y }, { emitEvent: false });
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
      const val = {transformationType: this.matrixItem.transformationType, matrix}
      this.onChange(val);
    });
  }
}
