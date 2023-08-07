import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Matrix } from '@babylonjs/core/Maths/math.vector';

import { MatSliderModule } from '@angular/material/slider';
import { TransformationEntry } from '../app.component';
import { TransformationType } from '../add-transformations/add-transformations.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-matrix',
  standalone: true,
  imports: [CommonModule, MatSliderModule, ReactiveFormsModule],
  templateUrl: './matrix.component.html',
  styleUrls: ['./matrix.component.css'],
})
export class MatrixComponent implements OnInit {
  ngOnInit(): void {
    this.slider.valueChanges.subscribe((val) => this.generateMatrix(val));

  }
  @Input() matrixItem: TransformationEntry;
  @Output() matrix = new EventEmitter<Matrix>();

  slider = new FormControl(0);

  generateMatrix(val : number): void {
    switch (this.matrixItem.transformationType) {
      case TransformationType.Translation:
        this.matrix.emit(Matrix.Translation(val,0,0));
        break;
      case TransformationType.Scaling:
        this.matrix.emit(Matrix.Scaling(val,val,val));
        break;
      case TransformationType.Rotation:
        this.matrix.emit(Matrix.RotationZ(val / 10.0));
        break;
    }
  }
}
