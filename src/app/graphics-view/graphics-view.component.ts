import { AfterViewInit, Component, ElementRef, HostListener, inject, input, OnChanges, OnInit, SimpleChanges, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Scene } from '@babylonjs/core/scene';

import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine';

import '@babylonjs/core/Engines/WebGPU/Extensions/engine.rawTexture';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Engines/WebGPU/Extensions/engine.alpha';

import { Camera } from '@babylonjs/core/Cameras/camera';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { CreateLineSystem } from '@babylonjs/core/Meshes/Builders/linesBuilder';
import { AxesViewer } from '@babylonjs/core/Debug/axesViewer';

import { Engine } from '@babylonjs/core/Engines/engine';
import { CreateGreasedLine } from '@babylonjs/core/Meshes/Builders/greasedLineBuilder';
import { createPalette } from 'hue-map';
import { LinesMesh } from '@babylonjs/core';

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

const lightBackgroundColor = '#f0f0f0'
const darkBackgroundColor = 'aaaaaa';

const lightContrastColor = '#888888'

const colorMix = (start: Color3, end: Color3, t: number) => new Color3(
  start.r * t + end.r * (1 - t),
  start.g * t + end.g * (1 - t),
  start.b * t + end.b * (1 - t)
);

const color4WithAlpha = (color: Color3, alpha: number) => new Color4(color.r, color.g, color.b, alpha);

@Component({
    selector: 'app-graphics-view',
    imports: [CommonModule],
    template: `<canvas #canvasRef></canvas>`,
    styleUrls: ['./graphics-view.component.css']
})
export class GraphicsViewComponent implements OnInit, AfterViewInit, OnChanges {
  ngAfterViewInit(): void {
    this.resize();
  }

  canvasElement = viewChild<ElementRef>('canvasRef');

  matrices = input<Array<Matrix>>([]);

  hoveredPicture = input(-1);  
  hoveredTransformation = input(-1);
  axesVisible = input(false);
  camera: FreeCamera;

  private engine: WebGPUEngine;
  private scene: Scene;

  private transformationMesh: LinesMesh = undefined;
  private pictureMeshes: Mesh[] = [];

  private coordinateSystemMesh: AxesViewer;
  private coordinateSystemInstances: AxesViewer[] = [];

  private elRef = inject(ElementRef);

  @HostListener('window:resize')
  resize(): void {
    const rect = this.elRef.nativeElement.getBoundingClientRect();
    console.log("Resize to: ", rect);

    this.canvasElement().nativeElement.width = rect.width;
    this.canvasElement().nativeElement.height = rect.height;

    const aspectRatio = rect.width / rect.height;

    this.engine.resize(true);

    this.camera.orthoTop = 5;
    this.camera.orthoBottom = -5;
    this.camera.orthoLeft = -5 * aspectRatio;
    this.camera.orthoRight = 5 * aspectRatio;
  }

  private model : Model = 'smiley';

  ngOnChanges(changes: SimpleChanges): void {
    this.rebuildMatrixBuffer(models[this.model]);
  }

  rebuildMatrixBuffer(points: Vector3[][]) {
    if (!this.scene) {
      return;
    }

    this.transformationMesh?.dispose();
    this.pictureMeshes.forEach(mesh => mesh.dispose());
    this.pictureMeshes = [];

    this.coordinateSystemInstances.forEach(axis => axis.dispose());
    this.coordinateSystemInstances = [];

    const startColor = Color4.FromColor3(Color3.Green());
    const stopColor = Color4.FromColor3(Color3.Yellow());

    const transformationStartColor = Color4.FromColor3(Color3.Blue());
    const transformationEndColor = Color4.FromColor3(Color3.Red());

    const highlightColor = Color4.FromColor3(Color3.Magenta());

    const intermediateColor = Color4.FromColor3(Color3.Gray());

    const matricesIncludingStart = [...this.matrices() ?? [], Matrix.Identity()];

    const matrixCount = matricesIncludingStart.length

    const matrixBuffer = new Float32Array(matrixCount * MAT4_ELEMENT_COUNT);
    const colorBuffer = new Float32Array(matrixCount * 4);

    let previousMatrix = Matrix.Identity();
    const lastIndex = matrixCount - 1;

    const colors = createPalette({
      map: 'viridis',
      steps: matrixCount,
    }).format('float');

    const currentColor = new Color4();

    const pictureSelected = this.hoveredPicture() !== -1;
    const transformationSelected = this.hoveredTransformation() !== -1;

    const colorTable = colors.map(color => Color3.FromArray(color));


    const firstPictureAlpha = this.hoveredPicture() === colorTable.length - 1 ? 0.8 : pictureSelected ? 0.1 : 0.2;
    const firstPictureColor = Color3.Lerp(Color3.FromHexString(lightBackgroundColor), colorTable[colorTable.length - 1], firstPictureAlpha);

    // Add first element
    this.pictureMeshes.push(CreateGreasedLine(`picture-initial`, { points }, { color: firstPictureColor }, this.scene));

    const visualData = matricesIncludingStart.reduceRight((acc, matrix, matrixIndex) => {
      previousMatrix = acc.matrixAcc;
      acc.matrixAcc = acc.matrixAcc.multiply(matrix);
      // acc.matrixAcc.copyToArray(acc.matrixBuffer, matrixIndex * MAT4_ELEMENT_COUNT);

      const rotationMatrix = acc.matrixAcc.getRotationMatrix();

      Color4.FromArrayToRef(colors[matrixIndex], 0, currentColor);

      if (this.axesVisible) {
        const axes = this.coordinateSystemMesh.createInstance();
        const pos = Vector3.TransformCoordinates(new Vector3(0, 0, 0), acc.matrixAcc)
        const xAxis = Vector3.TransformCoordinates(new Vector3(1, 0, 0), rotationMatrix);
        const yAxis = Vector3.TransformCoordinates(new Vector3(0, 1, 0), rotationMatrix);
        axes.update(pos, xAxis, yAxis, new Vector3(1, 1, 1));
        this.coordinateSystemInstances.push(axes);
      }

      const pictureAlpha = 
        this.hoveredPicture() === matrixIndex ? 0.8 : 
        pictureSelected ? 0.1 : 
        0.2;

      // Use Color3.Lerp
      const color3 = new Color3(currentColor.r, currentColor.g, currentColor.b);
      const pictureColor = Color3.Lerp(Color3.FromHexString(lightBackgroundColor), color3, pictureAlpha);
      // pictureColor.toArray(acc.colorBuffer, matrixIndex * 4);

      if (matrixIndex !== lastIndex) {
        acc.lines.push(...points.flat().map(point => [
          Vector3.TransformCoordinates(point, previousMatrix),
          Vector3.TransformCoordinates(point, acc.matrixAcc),
        ]))
      
        const selected = this.hoveredTransformation() === matrixIndex;
        
        const intensity = selected ? 0.8 : pictureSelected ? 0.1 : 0.2;
        
        const xpoints = points.map(line => line.map(point => Vector3.TransformCoordinates(point, acc.matrixAcc)));
        this.pictureMeshes.push(CreateGreasedLine(`picture-${matrixIndex}`, { points: xpoints }, { color: pictureColor }, this.scene));
        
        const alpha = selected ? 0.8 : pictureSelected ? 0.1 : 0.2;
          
        const startColor = colorTable[matrixIndex+1];
        const endColor = colorTable[matrixIndex];
      
        acc.lineColors.push(...points.flat().map(point => [
          color4WithAlpha(colorMix(startColor, Color3.FromHexString(lightContrastColor), 0.5), alpha), 
          color4WithAlpha(colorMix(endColor, Color3.FromHexString(lightContrastColor), 0.5), alpha)]
        ));
      }
      return acc
    }, {
      matrixAcc: Matrix.Identity(),
      lines: [new Array<Vector3>()],
      lineColors: [new Array<Color4>()]
    });

    this.transformationMesh = CreateLineSystem("transformation-lines", {
      lines: visualData.lines,
      colors: visualData.lineColors,
      instance: this.transformationMesh,
      updatable: true
    }, this.scene);

    this.transformationMesh.alphaIndex = 1;

    console.log("Re-created buffer");

    // if (!this.scene.isReady()) {
    // this.scene.onReadyObservable.addOnce(() => {
    //   this.engine.beginFrame();
    //   this.scene.render();
    //   this.engine.endFrame();
    // });
    // } else {
    //   this.engine.beginFrame();
    //   this.scene.render();
    //   this.engine.endFrame();
    // }
  }

  async ngOnInit() {
    const canvas = this.canvasElement().nativeElement;
    this.engine = new WebGPUEngine(canvas);
    await this.engine.initAsync();
    this.engine.runRenderLoop(() => {
      this.engine.beginFrame();
      this.scene.render();
      this.engine.endFrame();
    });



    this.createScene(); 
    this.coordinateSystemMesh = new AxesViewer(this.scene);
    this.coordinateSystemMesh.zAxis.dispose();
    [
      this.coordinateSystemMesh.xAxis,
      this.coordinateSystemMesh.yAxis
    ].forEach(mesh => mesh.setEnabled(false));

    this.setModel('smiley');

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
    this.scene.clearColor = Color4.FromHexString(lightBackgroundColor);
    return this.scene;
  }

  setModel(model: Model) {
    this.model = model;
    this.rebuildMatrixBuffer(models[model]);
  }
}
