import { Component } from '@angular/core';

import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgClass, NgIf } from '@angular/common';
import {
  AddTransformationsComponent,
  TransformationType,
} from './add-transformations/add-transformations.component';
import { GraphicsViewComponent } from './graphics-view/graphics-view.component';

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
    AddTransformationsComponent,
    GraphicsViewComponent
  ],
})
export class AppComponent {
  addTransformation(transformationType: TransformationType, index: number) {
    this.transformations.splice(index, 0, transformationType);
    this.select(index);
  }
  title = 'htt';
  transformations = ['Identity', 'Scale'];
  selectedIndex = 0;

  drop(event: CdkDragDrop<string[]>) {
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
    this.transformations.splice(index, 1);
  }
}
