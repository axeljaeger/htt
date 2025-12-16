import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type TransformationType = 'Rotation' | 'Scaling' | 'Shearing' | 'Translation';

@Component({
    selector: 'app-add-transformations',
    templateUrl: './add-transformations.component.html',
    styleUrls: ['./add-transformations.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
      '[style.--accent]': 'color()'
    }
})
export class AddTransformationsComponent {
  color = input<string>();
  public addTransformation = output<TransformationType>();
}
