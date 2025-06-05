import type { Meta, StoryObj } from '@storybook/angular';
import { MatrixComponent } from './matrix.component';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import { TransformationType } from '../add-transformations/add-transformations.component';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta: Meta<MatrixComponent> = {
  title: 'Matrix',
  component: MatrixComponent,
};

export default meta;
type Story = StoryObj<MatrixComponent>;

export const Primary: Story = {
  args: {
    //primary: true,

  },
  parameters: {
    layout: 'centered',
  },
};
