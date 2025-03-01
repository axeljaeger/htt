import { Component, computed, input } from '@angular/core';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';

export type Model = 'home' | 'smiley';

// const points = [
//   new Vector3(0, 0, 0),
//   new Vector3(1, 0, 0),
//   new Vector3(1, 1, 0),
//   new Vector3(0, 0, 0),
// ];

const circleRes = 8;

const circle = new Array(circleRes + 1).fill(0).map((val, index) => {
  const phi = index * 2 * Math.PI / circleRes;
  return new Vector3(Math.cos(phi), Math.sin(phi), 0.0)
});

const mouth = new Array(circleRes + 1).fill(0).map((val, index) => {
  const minPhi = Math.PI / 4;
  const maxPhi = 3 * Math.PI / 4;
  const phi = minPhi + (index / circleRes) * (maxPhi - minPhi);
  return new Vector3(Math.cos(phi), Math.sin(phi), 0.0).scale(0.5)
});

const smiley = [
  circle,
  circle.map(point => point.scale(0.25).add(new Vector3(0.4, -0.3, 0))),
  circle.map(point => point.scale(0.25).add(new Vector3(-0.4, -0.3, 0))),
  mouth
];

const setAlpha = (hex : string, alpha : number) => 
  /^#?[0-9A-Fa-f]{8}$/.test(hex) 
      ? `#${hex.replace("#", "").slice(0, 6)}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`
      : (() => { throw new Error("Hex muss im Format #RRGGBBAA sein"); })();

@Component({
  selector: 'app-svg-graphics-view',
  imports: [],
  templateUrl: './svg-graphics-view.component.html',
  styleUrl: './svg-graphics-view.component.css'
})
export class SvgGraphicsViewComponent {
  matrices = input<Matrix[]>();
  colors = input<string[]>();
  hoveredPicture = input(-1);  
  hoveredTransformation = input(-1);

  vm = computed(() => [...this.matrices(), Matrix.Identity()].reduceRight((acc, matrix, matrixIndex) => {
        const previousMatrix = acc.matrixAcc;
        acc.matrixAcc = acc.matrixAcc.multiply(matrix);
  
        // move outside of reduce
        const pictureSelected = this.hoveredPicture() !== -1;
        const transformationSelected = this.hoveredTransformation() !== -1;
        const lastIndex = this.matrices().length;
        const points = smiley;

        // Pictures
        const m = acc.matrixAcc.asArray();
        acc.pictureMatrices.push(`matrix(${m[0]}, ${m[1]}, ${m[4]}, ${m[5]}, ${m[12]}, ${m[13]})`);

        const pictureAlpha = 
          this.hoveredPicture() === matrixIndex ? 0.8 : 
          pictureSelected ? 0.1 : 
          0.2;
  
        // Somehow include pictureAlpha in the color
        const pictureColor = this.colors()[matrixIndex];
        acc.pictureColors.push(setAlpha(pictureColor, pictureAlpha));

        // Lines
        if (matrixIndex !== lastIndex) {
          acc.lines.push(points.flat().map(point => [
            Vector3.TransformCoordinates(point, previousMatrix),
            Vector3.TransformCoordinates(point, acc.matrixAcc),
          ]))
        
          const selected = this.hoveredTransformation() === matrixIndex;
          
          const intensity = selected ? 0.8 : pictureSelected ? 0.1 : 0.2;            
          const startColor = this.colors()[matrixIndex+1];
          const endColor = this.colors()[matrixIndex];
        
          // Include alpha here
          acc.lineColors.push(setAlpha(endColor, intensity));
        } 
        return acc
      }, {
        matrixAcc: Matrix.Identity(),
        
        // Pictures
        pictureMatrices: [] as string[],
        pictureColors: [] as string[],

        // Transformations between pictures
        lines: [] as [Vector3, Vector3][][],
        lineColors: [] as string[]
      }));
}

