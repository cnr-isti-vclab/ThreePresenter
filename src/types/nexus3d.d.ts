declare module 'nexus3d' {
  import * as THREE from 'three';
  
  export class NexusObject extends THREE.Mesh {
    constructor(
      url: string,
      onLoad?: () => void,
      onUpdate?: () => void,
      onError?: (error: Error) => void
    );
    
    onLoad: ((object: any) => void) | null;
    onUpdate: (() => void) | null;
    isReady: boolean;
    open(url: string): void;
    addToScene(scene: any): void;
  }
}
