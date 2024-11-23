import type { Meta, StoryObj } from '@storybook/angular';
import { AddTransformationsComponent } from './add-transformations.component';

const meta: Meta<AddTransformationsComponent> = {
  title: 'Add Transformation',
  component: AddTransformationsComponent,
};

export default meta;
type Story = StoryObj<AddTransformationsComponent>;

export const Primary: Story = {
  parameters: {
    layout: 'centered',
  },
};
