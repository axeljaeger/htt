import { AfterViewInit, Component, ElementRef, Host, HostListener, Input, NgZone, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Scene } from '@babylonjs/core/scene';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Matrix, Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';

import '@babylonjs/core/Meshes/thinInstanceMesh';
import "@babylonjs/core/Materials/standardMaterial";

import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { Mesh } from '@babylonjs/core/Meshes/mesh';

export const uniformSquareXY = () : VertexData => {
  const positions = [-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0];
  const uv = [1, 1, 0, 1, 1, 0, 0, 0];
  const indices = [0, 1, 2, 1, 3, 2];

  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.uvs = uv;
  return vertexData;
}

export interface LineTransformationResult {
  centerx: number;
  centery: number;
  rotation: number;
  scale: number;
}

const MAT4_ELEMENT_COUNT = 16;

/**
 * Calculates the transformation that transforms a uniform square to a line given by the two points
 * two points p1 and p2.
 * The transformation consists of centerx, centery, rotation and scale.
 * @param p1
 * @param p2
 * @returns The extracted center, rotation and scaling.
 */
export const transformationFromPoints = (p1: Vector2, p2: Vector2) : LineTransformationResult => {
  const center = Vector2.Center(p1, p2);
  const delta = p2.subtract(p1);
  const scale = delta.length();
  const rotation = Math.atan2(delta.y, delta.x);
  return { centerx: center.x, centery: center.y, rotation, scale };
}

@Component({
  selector: 'app-graphics-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graphics-view.component.html',
  styleUrls: ['./graphics-view.component.css']
})
export class GraphicsViewComponent implements AfterViewInit, OnChanges {
  @ViewChild('canvasRef', { static: true }) canvasElement: ElementRef;
  
  @Input() matrices : Array<Matrix> = []; 

  @HostListener('window:resize')
  resize() : void  {
    const rect = this.elRef.nativeElement.getBoundingClientRect();
    this.canvasElement.nativeElement.width = rect.width;
    this.canvasElement.nativeElement.height = rect.height;
    this.engine.resize();
  }

  private engine: Engine;
  private scene: Scene;

  private lineMesh : Mesh;

  constructor(private ngZone : NgZone, private elRef:ElementRef) {}
  
  ngOnChanges(changes: SimpleChanges): void {
    if (this.lineMesh) {
      this.rebuildMatrixBuffer();
    }
  }

  rebuildMatrixBuffer() {
    const points = [
      new Vector2(0,0),
      new Vector2(1,0),
      new Vector2(1,1)
    ];

    const indices = [
      [0,1],
      [1,2],
      [2,0]
    ];


    console.log(this.matrices);

    const matrixBuffer = new Float32Array(indices.length * this.matrices.length * MAT4_ELEMENT_COUNT);
    
    this.matrices.forEach((matrix, matrixIndex) => {
      indices.forEach((pair, vertexIndex) => {
        console.log(matrix);
        const transformed = pair.map((index) => Vector2.Transform(points[index], matrix));
        const result = transformationFromPoints(transformed[0], transformed[1]);
        const scalingMatrix = Matrix.Scaling(result.scale, 0.01, 1);
        const rotationMatrix = Matrix.RotationZ(result.rotation);
        const translationMatrix = Matrix.Translation(result.centerx, result.centery, 0);
        const matrix2 = scalingMatrix.multiply(rotationMatrix.multiply(translationMatrix));
        
        const matrixOffset = (matrixIndex * indices.length * MAT4_ELEMENT_COUNT)  +  vertexIndex * MAT4_ELEMENT_COUNT

        matrix2.copyToArray(matrixBuffer, matrixOffset);
      });
    });
    
    if (this.matrices.length > 0) {
      this.lineMesh.thinInstanceSetBuffer('matrix', matrixBuffer);
    }
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasElement.nativeElement;
    this.engine = new Engine(canvas, true, { stencil: true });

    this.scene = this.createScene();

    this.lineMesh = new Mesh('lineMesh', this.scene);
    uniformSquareXY().applyToMesh(this.lineMesh);
   
    this.rebuildMatrixBuffer();

    this.ngZone.runOutsideAngular(() => {
      this.engine.runRenderLoop(() => {
        this.scene.render();
      });
    });
  }

  createScene() {    
    const scene = new Scene(this.engine);
    const camera = new FreeCamera("camera1", 
        new Vector3(0, 5, -10), 
        scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl(this.canvasElement.nativeElement, true);
    const light = new HemisphericLight("light", 
        new Vector3(0, 1, 0), 
        scene);
    light.intensity = 0.7;

    return scene;
  }
}
