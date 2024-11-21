import { ChangeDetectionStrategy, Component, effect, HostBinding, input, output } from '@angular/core';
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
  imports: [ CommonModule, MatButtonModule ],
  templateUrl: './add-transformations.component.html',
  styleUrls: ['./add-transformations.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddTransformationsComponent {
  @HostBinding('style.backgroundColor') backgroundColor = 'lightblue';
  color = input<string>();

  updateCss = effect(() => {
    this.backgroundColor = this.color();
  });

  public TransformationType = TransformationType;
  public addTransformation = output<TransformationType>();
}
