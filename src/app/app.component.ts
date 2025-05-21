import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  CdkDrag, CdkDragDrop, CdkDropList
} from '@angular/cdk/drag-drop';

import {
  AddTransformationsComponent,
  TransformationType,
} from './add-transformations/add-transformations.component';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import { MatrixComponent } from './matrix/matrix.component';
import { createPalette } from 'hue-map';
import { SvgGraphicsViewComponent } from './svg-graphics-view/svg-graphics-view.component';

export interface TransformationEntry {
  transformationType: TransformationType;
  matrix: Matrix;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    imports: [
        CdkDrag,
        CdkDropList,
        MatrixComponent,
        AddTransformationsComponent,
        SvgGraphicsViewComponent,
        ReactiveFormsModule
    ]
})
export class AppComponent {
  private fb = inject(FormBuilder);
  title = 'htt';

  model = signal<'home' | 'smiley'>('home');

  hoveredPicture = -1;
  hoveredTransformation = -1;

  matrixArray = this.fb.array([
    this.fb.control({
      transformationType: 'Translation',
      matrix: Matrix.Translation(5, 0, 0),
    } as TransformationEntry)
  ])

  matrixArrayValues = toSignal(this.matrixArray.valueChanges, {
    initialValue: this.matrixArray.getRawValue(),
  });

  public colors = computed(() => createPalette({
      map: 'viridis',
      steps: this.matrixArrayValues().length + 1,
    }).format('cssHex')
  );

  matrixForm = this.fb.group({
    matrixArray: this.matrixArray
  });

  matrices = computed(() => this.matrixArrayValues().map(entry => entry.matrix));

  addTransformation(transformationType: TransformationType, index: number) {
    this.matrixArray.insert(index, this.fb.control(this.initialValue(transformationType)));
    this.hoverTransformation(index);
  }

  drop(event: CdkDragDrop<TransformationEntry[]>) {
    const control = this.matrixArray.controls.at(event.previousIndex);

    this.matrixArray.removeAt(event.previousIndex);
    this.matrixArray.insert(event.currentIndex, control);

    this.hoverTransformation(event.currentIndex);
  }

  deleteTransformation(index: number): void {
    this.matrixArray.removeAt(index);
  }

  initialValue(transformationType: TransformationType): TransformationEntry {
    const matrix = {
        ['Rotation']: Matrix.RotationZ(Math.PI / 2.0),
        ['Translation']: Matrix.Translation(1, 0, 0),
        ['Scaling']: Matrix.Scaling(1, 1, 1),
        ['Shearing']: Matrix.Scaling(2, 2, 2),
    }[transformationType];
    
    return {
      transformationType,
      matrix,
    };
  }

  matricesForTransformations(transformations: TransformationEntry[]): Matrix[] {
    return transformations.map((trans) => trans.matrix);
  }

  hoverPicture(index: number) {
    this.hoveredTransformation = -1
    this.hoveredPicture = index;
  }

  hoverTransformation(index: number): void {
    this.hoveredPicture = -1;
    this.hoveredTransformation = index;
  }
}
