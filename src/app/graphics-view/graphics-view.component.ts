import { AfterViewInit, Component, ElementRef, Host, HostListener, NgZone, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Scene } from '@babylonjs/core/scene';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import "@babylonjs/core/Materials/standardMaterial";


@Component({
  selector: 'app-graphics-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graphics-view.component.html',
  styleUrls: ['./graphics-view.component.css']
})
export class GraphicsViewComponent implements AfterViewInit {
  @ViewChild('canvasRef', { static: true }) canvasElement: ElementRef;
  
   
  @HostListener('window:resize')
  resize() : void  {
    const rect = this.elRef.nativeElement.getBoundingClientRect();
    this.canvasElement.nativeElement.width = rect.width;
    this.canvasElement.nativeElement.height = rect.height;
    this.engine.resize();
  }

  private engine: Engine;
  private scene: Scene;
 
  constructor(private ngZone : NgZone, private elRef:ElementRef) {}

  ngAfterViewInit(): void {
    const canvas = this.canvasElement.nativeElement;
    this.engine = new Engine(canvas, true, { stencil: true });

    this.scene = this.createScene();

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
    const sphere = CreateSphere("sphere", 
        {diameter: 2, segments: 32}, 
        scene);
    sphere.position.y = 1;
    return scene;
  }
}
