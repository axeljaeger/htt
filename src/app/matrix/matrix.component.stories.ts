import type { Meta, StoryObj } from '@storybook/angular';
import { fn } from '@storybook/test';
import { MatrixComponent } from './matrix.component';
import { Matrix } from '@babylonjs/core/Maths/math';
import { TransformationType } from '../add-transformations/add-transformations.component';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta: Meta<MatrixComponent> = {
  title: 'Matrix',
  component: MatrixComponent,
  tags: ['autodocs'],
//   argTypes: {
//     backgroundColor: {
//       control: 'color',
//     },
//   },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
//  args: { onClick: fn() },
};

export default meta;
type Story = StoryObj<MatrixComponent>;

export const Primary: Story = {
  args: {
    //primary: true,
    matrixItem: {
            transformationType: TransformationType.Translation,
            matrix: Matrix.Identity()
    },
  },
};
