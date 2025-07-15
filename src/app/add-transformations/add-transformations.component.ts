import { ChangeDetectionStrategy, Component, effect, HostBinding, input, output } from '@angular/core';

export type TransformationType = 'Rotation' | 'Scaling' | 'Shearing' | 'Translation';

@Component({
    selector: 'app-add-transformations',
    templateUrl: './add-transformations.component.html',
    styleUrls: ['./add-transformations.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddTransformationsComponent {
  @HostBinding('style.--accent') backgroundColor = 'lightblue';
  color = input<string>();
  updateCss = effect(() => this.backgroundColor = this.color());

  public addTransformation = output<TransformationType>();

}
