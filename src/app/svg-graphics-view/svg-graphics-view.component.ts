import { Component, computed, input } from '@angular/core';

export type Model = 'home' | 'smiley';

const circleRes = 8;

const circle = new Array(circleRes + 1).fill(0).map((val, index) => {
  const phi = index * 2 * Math.PI / circleRes;
  return new DOMPoint(Math.cos(phi), Math.sin(phi))
});

const mouth = new Array(circleRes + 1).fill(0).map((val, index) => {
  const minPhi = Math.PI / 4;
  const maxPhi = 3 * Math.PI / 4;
  const phi = minPhi + (index / circleRes) * (maxPhi - minPhi);
  return new DOMPoint(Math.cos(phi) * 0.5, Math.sin(phi) * 0.5)
});

const smiley = [
  circle,
  circle.map(point => new DOMPoint(point.x * 0.25 + 0.4, point.y * 0.25 - 0.3)),
  circle.map(point => new DOMPoint(point.x * 0.25 - 0.4, point.y * 0.25 - 0.3)),
  mouth
];

const home = [
  new DOMPoint(0,0,0),
  new DOMPoint(1,0,0),
  new DOMPoint(0,-1,0),
  new DOMPoint(1,-1,0),
  new DOMPoint(.5, -1.5, 0),
  new DOMPoint(0,-1,0),
  new DOMPoint(0,0,0),
  new DOMPoint(1,-1,0),
  new DOMPoint(1,0,0),
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
  matrices = input<DOMMatrix[]>();
  pictureColors = input<string[]>();
  transformationColors = input<string[]>();  
  hoveredPicture = input(-1);  
  hoveredTransformation = input(-1);
  model = input<Model>('home');

  vm = computed(() => [...this.matrices(), new DOMMatrix()].reduceRight((acc, matrix, matrixIndex) => {
        const previousMatrix = acc.matrixAcc;
        acc.matrixAcc = acc.matrixAcc.multiply(matrix);
  
        const pictureSelected = this.hoveredPicture() !== -1;
        const transformationSelected = this.hoveredTransformation() !== -1;
        const lastIndex = this.matrices().length;
        const points = this.model() === 'smiley' ? smiley : home;

        // Pictures
        const m = acc.matrixAcc;
        const matrixString = `matrix(${m.a}, ${m.b}, ${m.c}, ${m.d}, ${m.e}, ${m.f})`;
    
        const pictureAlpha = 
          this.hoveredPicture() === matrixIndex ? 0.8 : 
          pictureSelected ? 0.1 : 
          0.2;
  
        // Somehow include pictureAlpha in the color
        const pictureColor = this.pictureColors()[matrixIndex];
        const color = setAlpha(pictureColor, pictureAlpha);
        acc.pictures.push({ matrix: matrixString, color });

        // Lines
        if (matrixIndex !== lastIndex) {
          const path = points.flat().reduce((accx, point) => {
            const p1 = point.matrixTransform(previousMatrix);
            const p2 = point.matrixTransform(acc.matrixAcc);
            return accx + `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} `;
          }, '');
        
          const selected = this.hoveredTransformation() === matrixIndex;
          
          const intensity = selected ? 0.8 : pictureSelected ? 0.1 : 0.2;
          
          
        
          const color = setAlpha(this.transformationColors()[matrixIndex], intensity);
          acc.lines.push({path, color});
        } 
        return acc
      }, {
        matrixAcc: new DOMMatrix(),
        pictures: [] as { matrix: string, color: string} [],
        lines: [] as { path: string, color: string}[],
      }));
}
