import { Component, computed, signal } from '@angular/core';
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
import { Field, form } from '@angular/forms/signals';

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
        Field
    ]
})
export class AppComponent {
  protected model = signal<'home' | 'smiley'>('home');

  protected hoveredPicture = signal(-1);
  protected hoveredTransformation = signal(-1);

  protected matrixModel = signal<{ id: string; entry: TransformationEntry }[]>([{
    id: crypto.randomUUID(),
    entry: {
      transformationType: 'Translation',
      matrix: Matrix.Translation(5, 0, 0),
    }
  }]);

  protected matrixForm = form(this.matrixModel);
  protected matrices = computed(() => this.matrixModel().map(entry => entry.entry.matrix));

  protected pictureColors = computed(() => createPalette({
      map: 'viridis',
      steps: this.matrixModel().length + 1,
    }).format('cssHex')
  );

  protected transformationColors = computed(() => createPalette({
      map: 'viridis',
      steps: this.matrixModel().length + 2,
    }).format('cssHex').slice(1)
  );

  protected addTransformation(transformationType: TransformationType, index: number) {
    const matrix = {
        ['Rotation']: Matrix.RotationZ(Math.PI / 2.0),
        ['Translation']: Matrix.Translation(1, 0, 0),
        ['Scaling']: Matrix.Scaling(1, 1, 1),
        ['Shearing']: Matrix.Scaling(2, 2, 2),
    }[transformationType];

    const entry = {
      transformationType,
      matrix,
    }

    this.matrixModel.update(models => models.toSpliced(index, 0, {
        id: crypto.randomUUID(),
        entry
      })
    );
    this.hoverTransformation(index);
  }

  protected drop(event: CdkDragDrop<TransformationEntry[]>) {
    this.matrixModel.update(models => {
      const moved = models[event.previousIndex];
      return models
        .toSpliced(event.previousIndex, 1)
        .toSpliced(event.currentIndex, 0, moved);
    });
    this.hoverTransformation(event.currentIndex);
  }

  protected deleteTransformation(index: number): void {
    this.matrixModel.update(models => 
        models.toSpliced(index, 1)
    );
  }

  protected hoverPicture(index: number) {
    this.hoveredTransformation.set(-1);
    this.hoveredPicture.set(index);
  }

  protected hoverTransformation(index: number): void {
    this.hoveredPicture.set(-1);
    this.hoveredTransformation.set(index);
  }
}
