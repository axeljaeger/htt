import { Component } from '@angular/core';

import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgClass, NgIf, AsyncPipe } from '@angular/common';
import {
  AddTransformationsComponent,
  TransformationType,
} from './add-transformations/add-transformations.component';
import { GraphicsViewComponent } from './graphics-view/graphics-view.component';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import { BehaviorSubject, map } from 'rxjs';
import { MatrixComponent } from './matrix/matrix.component';

export interface TransformationEntry {
  transformationType: TransformationType;
  matrix: Matrix;
  uuid: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    NgFor,
    NgClass,
    NgIf,
    AsyncPipe,
    AddTransformationsComponent,
    GraphicsViewComponent,
    MatrixComponent,
  ],
})
export class AppComponent {
  addTransformation(transformationType: TransformationType, index: number) {
    const newValue = [...this.transformations.value];
    newValue.splice(index, 0, this.initialValue(transformationType));
    this.transformations.next(newValue);
    this.matrices.next(this.matricesForTransformations(this.transformations.value));
    this.select(index);
  }
  title = 'htt';
  selectedIndex = 0;

  transformations = new BehaviorSubject<TransformationEntry[]>([
    {
      transformationType: TransformationType.Scaling,
      matrix: Matrix.Translation(2, 0, 0),
      uuid: 'xxx'
    },
  ]);
  
  
  matrices = new BehaviorSubject<Matrix[]>([]);
  
  drop(event: CdkDragDrop<TransformationEntry[]>) {
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    this.select(event.currentIndex);
  }

  select(index: number): void {
    this.selectedIndex = index;
  }

  deleteTransformation(index: number): void {
    console.log(`Number of transformations before: ${this.transformations.value.length}`);
    const val = [...this.transformations.value]
    val.splice(index, 1);
    this.transformations.next(val);
    this.matrices.next(this.matricesForTransformations(this.transformations.value));
    console.log(`Number of transformations after: ${this.transformations.value.length}`);

  }

  setMatrixAt(matrix: Matrix, index: number): void {
    // BAD: Directly manipulating value, but here on purpose.
    // this.transformations.value[index] = { ...this.transformations.value[index], matrix };
    const newMatrices = [...this.matrices.value]
    newMatrices[index] = matrix;
    this.matrices.next(newMatrices);
  }

  initialValue(transformationType: TransformationType): TransformationEntry {
    const matrix = ((transformation) => {
      switch (transformation) {
        case TransformationType.Rotation:
          return Matrix.RotationZ(Math.PI / 2.0);
        case TransformationType.Translation:
          return Matrix.Translation(1, 1, 0);
        case TransformationType.Scaling:
          return Matrix.Scaling(2, 2, 2);
        case TransformationType.Shearing:
          return Matrix.Scaling(2, 2, 2);
      }
    })(transformationType);

    return {
      transformationType,
      matrix,
      uuid: `${Math.random}`
    };
  }

  matricesForTransformations(transformations: TransformationEntry[]) : Matrix[] {
    return transformations.map((trans) => trans.matrix);
  }

  transformationByUUid(index : number, transformationEntry : TransformationEntry) : string {
    return transformationEntry.uuid;
  }
}
