declare module 'nexus3d' {
  import * as THREE from 'three';

  export interface NexusOptions {
    onLoad?: (obj?: any) => void;
    onUpdate?: () => void;
    onProgress?: (progress: any) => void;
    material?: THREE.Material;
  }

  export class NexusObject extends THREE.Mesh {
    constructor(
      url: string | object,
      rendererOrOnLoad?: any,
      onUpdate?: any,
      onError?: any
    );

    isReady: boolean;
    onLoad: Array<(obj?: any) => void>;
    onUpdate: Array<() => void>;
    open(url: string): void;
    addToScene(scene: THREE.Scene): void;
  }

  // Provide both named and default export for broader compatibility
  export { NexusObject };
  export default NexusObject;
}
declare module 'nexus3d_lamaialaditunonna' {
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
