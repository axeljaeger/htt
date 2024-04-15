import { Component, inject } from '@angular/core';

import {
  DragDropModule,
  CdkDragDrop,
} from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {MatButtonToggleChange, MatButtonToggleModule} from '@angular/material/button-toggle';

import { AsyncPipe } from '@angular/common';
import {
  AddTransformationsComponent,
  TransformationType,
} from './add-transformations/add-transformations.component';
import { GraphicsViewComponent } from './graphics-view/graphics-view.component';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import { MatrixComponent } from './matrix/matrix.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';

export interface TransformationEntry {
  transformationType: TransformationType;
  matrix: Matrix;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    DragDropModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    AsyncPipe,
    AddTransformationsComponent,
    GraphicsViewComponent,
    MatrixComponent,
    ReactiveFormsModule,

  ],
})
export class AppComponent {
  axesVisible : false;

  setAxesVisible($event: MatButtonToggleChange) {
  this.axesVisible = $event.value.includes('axes');
}
  private fb = inject(FormBuilder);
  title = 'htt';
  selectedIndex = 0;

  hoveredTransformation = -1;



  matrixArray = this.fb.array([
    this.fb.control({
      transformationType: TransformationType.Translation,
      matrix: Matrix.Translation(5, 0, 0),
    } as TransformationEntry)
  ])

  matrixForm = this.fb.group({
    matrixArray: this.matrixArray
  });

  matrices$ = this.matrixArray.valueChanges.pipe(startWith(this.matrixArray.value), map(entries => entries.map(entry => entry.matrix)));

  addTransformation(transformationType: TransformationType, index: number) {
    this.matrixArray.insert(index, this.fb.control(this.initialValue(transformationType)));
    this.select(index);
  }

  drop(event: CdkDragDrop<TransformationEntry[]>) {
    const control = this.matrixArray.controls.at(event.previousIndex);

    this.matrixArray.removeAt(event.previousIndex);
    this.matrixArray.insert(event.currentIndex, control);

    this.select(event.currentIndex);
  }

  select(index: number): void {
    this.selectedIndex = index;
  }

  deleteTransformation(index: number): void {
    this.matrixArray.removeAt(index);
  }

  initialValue(transformationType: TransformationType): TransformationEntry {
    const matrix = ((transformation) => {
      switch (transformation) {
        case TransformationType.Rotation:
          return Matrix.RotationZ(Math.PI / 2.0);
        case TransformationType.Translation:
          return Matrix.Translation(1, 0, 0);
        case TransformationType.Scaling:
          return Matrix.Scaling(1, 1, 1);
        case TransformationType.Shearing:
          return Matrix.Scaling(2, 2, 2);
      }
    })(transformationType);

    return {
      transformationType,
      matrix,
    };
  }

  matricesForTransformations(transformations: TransformationEntry[]): Matrix[] {
    return transformations.map((trans) => trans.matrix);
  }

  hoverTransformation(event: number) {
    this.hoveredTransformation = event;
  }
}
