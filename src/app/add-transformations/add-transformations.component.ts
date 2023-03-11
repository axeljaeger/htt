import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

export enum TransformationType {
  Rotation = 'Rotation',
  Scaling = 'Scaling',
  Shearing = 'Shearing',
  Translation = 'Translation'
}


@Component({
  selector: 'app-add-transformations',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './add-transformations.component.html',
  styleUrls: ['./add-transformations.component.css']
})
export class AddTransformationsComponent {
  public TransformationType = TransformationType;
  @Output() public addTransformation = new EventEmitter<TransformationType>();
}
