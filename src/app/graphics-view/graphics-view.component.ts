import { Component, ElementRef, HostListener, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Scene } from '@babylonjs/core/scene';

import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine';

import '@babylonjs/core/Meshes/thinInstanceMesh';
import '@babylonjs/core/Materials/standardMaterial';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { CreateLineSystem } from '@babylonjs/core/Meshes/Builders/linesBuilder';
import { AxesViewer } from '@babylonjs/core/Debug/axesViewer';

import "@babylonjs/core/Engines/WebGPU/Extensions/engine.alpha"
import { Engine } from '@babylonjs/core/Engines/engine';

const MAT4_ELEMENT_COUNT = 16;

export type Model = 'home' | 'smiley';

// const points = [
//   new Vector3(0, 0, 0),
//   new Vector3(1, 0, 0),
//   new Vector3(1, 1, 0),
//   new Vector3(0, 0, 0),
// ];

const circleRes = 20;

const circle = new Array(circleRes + 1).fill(0).map((val, index) => {
  const phi = index * 2 * Math.PI / circleRes;
  return new Vector3(Math.cos(phi), Math.sin(phi), 0.0)
});

const mouth = new Array(circleRes + 1).fill(0).map((val, index) => {
  const minPhi = -Math.PI / 4;
  const maxPhi = -3 * Math.PI / 4;
  const phi = minPhi + (index / circleRes) * (maxPhi - minPhi);
  return new Vector3(Math.cos(phi), Math.sin(phi), 0.0).scale(0.5)
});

const smiley = [
  circle,
  circle.map(point => point.scale(0.25).add(new Vector3(0.4, 0.3, 0))),
  circle.map(point => point.scale(0.25).add(new Vector3(-0.4, 0.3, 0))),
  mouth
];

const home = [
  [
    new Vector3(0,0,0),
    new Vector3(1,0,0),
    new Vector3(0,1,0),
    new Vector3(1,1,0),

    new Vector3(.5,1.5,0),
    new Vector3(0,1,0),
    new Vector3(0,0,0),

    new Vector3(1,1,0),
    new Vector3(1,0,0),
  ]
]

const models : Record<Model, Vector3[][]> = {
  smiley,
  home
};

@Component({
  selector: 'app-graphics-view',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas #canvasRef></canvas>`,
  styleUrls: ['./graphics-view.component.css']
})
export class GraphicsViewComponent implements OnInit, OnChanges {
  @ViewChild('canvasRef', { static: true }) canvasElement: ElementRef;

  @Input() matrices: Array<Matrix> = [];

  @Input() hoveredPicture = -1;  
  @Input() hoveredTransformation = -1;

  @Input() axesVisible = false;
  camera: FreeCamera;

  private engine: WebGPUEngine;
  private scene: Scene;

  private lineMesh: Mesh;
  private transformationMesh: Mesh;

  private coordinateSystemMesh: AxesViewer;
  private coordinateSystemInstances: AxesViewer[] = [];

  constructor(private elRef: ElementRef) { }

  @HostListener('window:resize')
  resize(): void {
    const rect = this.elRef.nativeElement.getBoundingClientRect();
    this.canvasElement.nativeElement.width = rect.width;
    this.canvasElement.nativeElement.height = rect.height;

    const aspectRatio = rect.width / rect.height;

    this.engine.resize(true);

    this.camera.orthoTop = 5;
    this.camera.orthoBottom = -5;
    this.camera.orthoLeft = -5 * aspectRatio;
    this.camera.orthoRight = 5 * aspectRatio;
  }

  private model : Model = 'smiley';

  ngOnChanges(changes: SimpleChanges): void {
    if (this.lineMesh) {
      this.rebuildMatrixBuffer(models[this.model]);
    }
  }

  rebuildMatrixBuffer(points: Vector3[][]) {
    if (!this.lineMesh) {
      return;
    }

    this.transformationMesh?.dispose();
    this.coordinateSystemInstances.forEach(axis => axis.dispose());
    this.coordinateSystemInstances = [];

    const startColor = Color4.FromColor3(Color3.Green());
    const stopColor = Color4.FromColor3(Color3.Yellow());

    const transformationStartColor = Color4.FromColor3(Color3.Blue());
    const transformationEndColor = Color4.FromColor3(Color3.Red());

    const highlightColor = Color4.FromColor3(Color3.Magenta());

    const intermediateColor = Color4.FromColor3(Color3.Gray());

    const matricesIncludingStart = [...this.matrices ?? [], Matrix.Identity()];

    const matrixBuffer = new Float32Array(matricesIncludingStart.length * MAT4_ELEMENT_COUNT);
    const colorBuffer = new Float32Array(matricesIncludingStart.length * 4);

    let previousMatrix = Matrix.Identity();
    const lastIndex = matricesIncludingStart.length - 1;

    const visualData = matricesIncludingStart.reduceRight((acc, matrix, matrixIndex) => {
      previousMatrix = acc.matrixAcc;
      acc.matrixAcc = acc.matrixAcc.multiply(matrix);
      acc.matrixAcc.copyToArray(acc.matrixBuffer, matrixIndex * MAT4_ELEMENT_COUNT);

      const rotationMatrix = acc.matrixAcc.getRotationMatrix();

      if (this.axesVisible) {
        const axes = this.coordinateSystemMesh.createInstance();
        const pos = Vector3.TransformCoordinates(new Vector3(0, 0, 0), acc.matrixAcc)
        const xAxis = Vector3.TransformCoordinates(new Vector3(1, 0, 0), rotationMatrix);
        const yAxis = Vector3.TransformCoordinates(new Vector3(0, 1, 0), rotationMatrix);
        axes.update(pos, xAxis, yAxis, new Vector3(1, 1, 1));
        this.coordinateSystemInstances.push(axes);
      }

      const pictureColor = 
        this.hoveredPicture === matrixIndex ? highlightColor :
        this.hoveredTransformation > -1 && this.hoveredTransformation === matrixIndex - 1 ? transformationStartColor :
        this.hoveredTransformation > -1 && this.hoveredTransformation === matrixIndex  ? transformationEndColor :
        matrixIndex === 0 ? startColor :
        matrixIndex === lastIndex ? stopColor : intermediateColor;

      pictureColor.toArray(acc.colorBuffer, matrixIndex * 4);

      if (matrixIndex !== lastIndex) {
        acc.lines.push(...points.flat().map(point => [
          Vector3.TransformCoordinates(point, previousMatrix),
          Vector3.TransformCoordinates(point, acc.matrixAcc),
        ]))
      
        const selected = this.hoveredTransformation === matrixIndex;
        const startColor = Color4.FromColor3(selected ? Color3.Blue() : Color3.Gray());
        const endColor = Color4.FromColor3(selected ? Color3.Red() : Color3.Gray());
        
        acc.lineColors.push(...points.flat().map(point => [startColor, endColor]));
      }
      return acc
    }, {
      matrixAcc: Matrix.Identity(),
      matrixBuffer,
      colorBuffer,
      lines: [new Array<Vector3>()],
      lineColors: [new Array<Color4>()]
    });

    if (matricesIncludingStart.length > 0) {
      this.lineMesh.thinInstanceSetBuffer('matrix', matrixBuffer);
      this.lineMesh.thinInstanceSetBuffer('color', colorBuffer, 4);
    }

    this.transformationMesh?.dispose();
    this.transformationMesh = CreateLineSystem("transformation-lines", {
      lines: visualData.lines,
      colors: visualData.lineColors
    }, this.scene);
    this.engine.beginFrame();
    this.scene.render();
    this.engine.endFrame();
  }

  async ngOnInit() {
    const canvas = this.canvasElement.nativeElement;
    this.engine = new WebGPUEngine(canvas);
    await this.engine.initAsync();

    this.createScene();

    this.lineMesh = CreateLineSystem('picture', { lines: smiley }, this.scene);

    this.coordinateSystemMesh = new AxesViewer(this.scene);
    this.coordinateSystemMesh.zAxis.dispose();
    [
      this.coordinateSystemMesh.xAxis,
      this.coordinateSystemMesh.yAxis
    ].forEach(mesh => mesh.setEnabled(false));

    this.rebuildMatrixBuffer(smiley);

    this.resize();
    this.engine.beginFrame();
    this.scene.render();
    this.engine.endFrame();
  }

  createScene() {
    this.scene = new Scene(this.engine);
    this.camera = new FreeCamera("camera1",
      new Vector3(0, 0, -10),
      this.scene);
    this.camera.setTarget(Vector3.Zero());

    this.camera.mode = Camera.ORTHOGRAPHIC_CAMERA;

    this.engine.setDepthFunction(Engine.ALWAYS);

    const renderingOrder = [
      'transformation-lines',
      'picture',
    ];

    this.scene.setRenderingOrder(0, undefined,
      undefined,
      (meshA, meshB) => {
        const indexA = renderingOrder.indexOf(meshA.getMesh().name);
        const indexB = renderingOrder.indexOf(meshB.getMesh().name);
        if (indexA === indexB) return 0
        else if (indexA > indexB) return 1
        else return -1
      }
    );

    //this.camera.attachControl(this.canvasElement.nativeElement, true);
    const light = new HemisphericLight("light",
      new Vector3(0, 1, 0),
      this.scene);
    light.intensity = 0.7;
    return this.scene;
  }

  setModel(model: Model) {
    
    this.model = model;
    this.lineMesh?.dispose();
    this.lineMesh = CreateLineSystem('picture', { lines: models[model] }, this.scene);

    this.rebuildMatrixBuffer(models[model]);
  }
}