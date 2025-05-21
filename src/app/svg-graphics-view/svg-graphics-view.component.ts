import { Component, computed, input } from '@angular/core';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';

export type Model = 'home' | 'smiley';

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

const home = [
  new Vector3(0,0,0),
  new Vector3(1,0,0),
  new Vector3(0,-1,0),
  new Vector3(1,-1,0),
  new Vector3(.5, -1.5, 0),
  new Vector3(0,-1,0),
  new Vector3(0,0,0),
  new Vector3(1,-1,0),
  new Vector3(1,0,0),
]

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
  model = input<Model>('home');

  vm = computed(() => [...this.matrices(), Matrix.Identity()].reduceRight((acc, matrix, matrixIndex) => {
        const previousMatrix = acc.matrixAcc;
        acc.matrixAcc = acc.matrixAcc.multiply(matrix);
  
        // move outside of reduce
        const pictureSelected = this.hoveredPicture() !== -1;
        const transformationSelected = this.hoveredTransformation() !== -1;
        const lastIndex = this.matrices().length;
        const points = this.model() === 'smiley' ? smiley : home;

        // Pictures
        const m = acc.matrixAcc.asArray();
        const matrixString = `matrix(${m[0]}, ${m[1]}, ${m[4]}, ${m[5]}, ${m[12]}, ${m[13]})`;
    
        const pictureAlpha = 
          this.hoveredPicture() === matrixIndex ? 0.8 : 
          pictureSelected ? 0.1 : 
          0.2;
  
        // Somehow include pictureAlpha in the color
        const pictureColor = this.colors()[matrixIndex];
        const color = setAlpha(pictureColor, pictureAlpha);
        acc.pictures.push({ matrix: matrixString, color });

        // Lines
        if (matrixIndex !== lastIndex) {
          const path = points.flat().reduce((accx, point) => {
            const p1 = Vector3.TransformCoordinates(point, previousMatrix);
            const p2 = Vector3.TransformCoordinates(point, acc.matrixAcc);
            return accx + `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} `;
          }, '');
        
          const selected = this.hoveredTransformation() === matrixIndex;
          
          const intensity = selected ? 0.8 : pictureSelected ? 0.1 : 0.2;
          const startColor = this.colors()[matrixIndex+1];
          const endColor = this.colors()[matrixIndex];
        
          const color = setAlpha(endColor, intensity);
          acc.lines.push({path, color});
        } 
        return acc
      }, {
        matrixAcc: Matrix.Identity(),
        pictures: [] as { matrix: string, color: string} [],
        lines: [] as { path: string, color: string}[],
      }));
}
