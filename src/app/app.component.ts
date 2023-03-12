import { Component } from '@angular/core';

import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
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

interface TransformationEntry {
  transformationType: TransformationType;
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
    GraphicsViewComponent
  ],
})
export class AppComponent {

  addTransformation(transformationType: TransformationType, index: number) {
    const newValue = [...this.transformations.value];
    newValue.splice(index, 0, transformationType)
    this.transformations.next(newValue);
    this.select(index);
  }
  title = 'htt';
  selectedIndex = 0;

  transformations = new BehaviorSubject<TransformationType[]>([TransformationType.Scaling]);
  matrices = this.transformations.pipe(map((transformations) => this.generateMatrices(transformations)));

  drop(event: CdkDragDrop<TransformationType[]>) {
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

  deleteTransformation(index : number) : void {
    this.transformations.next([...this.transformations.value].splice(index, 1));
  }

  generateMatrices(transformations : TransformationType[]) : Matrix[] {
    return transformations.map((transformation) => {
      switch (transformation) {
        case TransformationType.Rotation: 
          return Matrix.RotationZ(Math.PI / 2.0);
        case TransformationType.Translation:
          return Matrix.Translation(1,1,0);
        case TransformationType.Scaling:
          return Matrix.Scaling(2,2,2);
        case TransformationType.Shearing:
          return Matrix.Scaling(2,2,2);
      }
    })
  }
}
