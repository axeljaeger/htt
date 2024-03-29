import { Component, ElementRef, HostListener, Input, NgZone, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
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

import "@babylonjs/core/Engines/WebGPU/Extensions/engine.alpha"
import { Engine } from '@babylonjs/core/Engines/engine';

const MAT4_ELEMENT_COUNT = 16;

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
  @Input() selectedIndex = -1;
  @Input() hoveredTransformation = -1;
  camera: FreeCamera;

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

  private engine: WebGPUEngine;
  private scene: Scene;

  private lineMesh: Mesh;
  private transformationMesh: Mesh;

  constructor(private ngZone: NgZone, private elRef: ElementRef) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.lineMesh) {
      this.rebuildMatrixBuffer(smiley);
    }
  }

  rebuildMatrixBuffer(points: Vector3[][]) {
    if (!this.lineMesh) {
      return;
    }

    this.transformationMesh?.dispose();

    const startStopColor = Color4.FromColor3(Color3.White());
    const intermediateColor = Color4.FromColor3(Color3.Gray());

    const matricesIncludingStart = [Matrix.Identity(), ...this.matrices ?? []];

    const matrixBuffer = new Float32Array(matricesIncludingStart.length * MAT4_ELEMENT_COUNT);
    const colorBuffer = new Float32Array(matricesIncludingStart.length * 4);

    let previousMatrix = Matrix.Identity();

    const visualData = matricesIncludingStart.reduce((acc, matrix, matrixIndex) => {
      previousMatrix = acc.matrixAcc;
      acc.matrixAcc = matrix.multiply(acc.matrixAcc);
      acc.matrixAcc.copyToArray(acc.matrixBuffer, matrixIndex * MAT4_ELEMENT_COUNT);

      ((matrixIndex === 0 || matrixIndex === matricesIncludingStart.length - 1 || this.hoveredTransformation === matrixIndex) ?
        startStopColor : intermediateColor).toArray(acc.colorBuffer, matrixIndex * 4);

      if (matrixIndex !== 0) {
        acc.lines.push(...points.flat().map(point => [
          Vector3.TransformCoordinates(point, previousMatrix),
          Vector3.TransformCoordinates(point, acc.matrixAcc),
        ]))
        const color = Color4.FromColor3(this.selectedIndex === matrixIndex - 1 ? Color3.Blue() : Color3.Gray());
        acc.lineColors.push(...points.flat().map(point => [color, color]));
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

    this.rebuildMatrixBuffer(smiley);

    this.resize();
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
}