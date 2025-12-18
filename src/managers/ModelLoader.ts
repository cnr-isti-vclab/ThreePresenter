import * as THREE from 'three';

/**
 * Configuration for model loading
 */
export interface LoaderConfig {
  /** Path to Draco decoder (default: Google CDN) */
  dracoDecoderPath?: string;
  /** Draco decoder type (default: 'js') */
  dracoDecoderType?: 'js' | 'wasm';
  /** Whether to automatically compute vertex normals for PLY (default: true) */
  autoComputeNormals?: boolean;
  /** Default material properties for PLY files */
  defaultMaterial?: {
    color?: number;
    flatShading?: boolean;
    metalness?: number;
    roughness?: number;
  };

}

/**
 * Material properties that can be applied to loaded models
 */
export interface MaterialProperties {
  color?: number;
  flatShading?: boolean;
  metalness?: number;
  roughness?: number;
}

/**
 * Progress callback for loading operations
 */
export type ProgressCallback = (loaded: number, total: number, percentage: number) => void;

/**
 * Result of a successful load operation
 */
export interface LoadResult {
  /** The loaded Three.js object */
  object: THREE.Object3D;
  /** The original format that was loaded */
  format: 'ply' | 'gltf' | 'glb' | 'nxs' | 'nxz';
  /** Size of the loaded data in bytes */
  byteSize: number;
}

/**
 * ModelLoader handles loading of 3D model files in various formats.
 * 
 * Supported formats:
 * - PLY (Polygon File Format)
 * - GLTF (GL Transmission Format)
 * - GLB (GLTF Binary)
 * 
 * Features:
 * - Automatic format detection from file extension
 * - Draco compression support for GLTF/GLB
 * - Material property overrides
 * - Progress tracking
 * - Error handling with detailed messages
 * - Lazy loading of format-specific loaders
 * 
 * @example
 * ```typescript
 * const loader = new ModelLoader({
 *   dracoDecoderPath: 'https://cdn.com/draco/',
 *   defaultMaterial: { color: 0xcccccc }
 * });
 * 
 * // Load from URL
 * const result = await loader.loadFromUrl('/models/scene.glb');
 * scene.add(result.object);
 * 
 * // Load from buffer with material override
 * const buffer = await fetch('/models/mesh.ply').then(r => r.arrayBuffer());
 * const result = await loader.loadFromBuffer(buffer, 'ply', {
 *   color: 0xff0000,
 *   metalness: 0.8
 * });
 * ```
 */
/**
 * ModelLoader
 *
 * Behavior summary:
 * - parsePLY: returns a THREE.Mesh created from PLY geometry. By default, PLY geometry
 *   is not normalized or re-centered; set `autoComputeNormals` to true to compute
 *   vertex normals. The returned mesh preserves the geometry's original coordinates.
 *
 * - parseGLTF / parseGLB: returns a THREE.Group containing cloned meshes from the
 *   GLTF scene. Materials can be overridden via `materialOverrides`. The loader
 *   does not normalize or re-center GLTF models — transforms defined in the file
 *   are preserved as-is.
 *
 * - parseNexus (NXS / NXZ): Nexus is a streaming, multi-resolution format. This
 *   loader returns a Promise that resolves once the Nexus `onLoad` event has
 *   fired (initial model data available). The loader DOES NOT mutate the
 *   Nexus object's transform (no auto-scaling or centering). The loader will
 *   populate `geometry.boundingSphere` and `geometry.boundingBox` from Nexus's
 *   reported `boundingSphere` on `onLoad` and `onUpdate` so scene-level
 *   bounding computations (Box3.setFromObject) work correctly.
 *
 * - General: Model transforms (position, rotation, scale) are not applied by the
 *   ModelLoader; those are applied by the caller (e.g., ThreePresenter.applyTransforms())
 *   after loading. This keeps model loading and scene presentation responsibilities
 *   separate.
 */
export class ModelLoader {
  private config: Required<LoaderConfig>;
  private renderer: THREE.WebGLRenderer | null = null;
  private plyLoader: any = null;
  private gltfLoader: any = null;
  private dracoLoader: any = null;

  /**
   * Create a new model loader
   * @param config Configuration options
   */
  constructor(config: LoaderConfig = {}, renderer?: THREE.WebGLRenderer) {
    this.config = {
      dracoDecoderPath: config.dracoDecoderPath ?? 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/',
      dracoDecoderType: config.dracoDecoderType ?? 'js',
      autoComputeNormals: config.autoComputeNormals ?? true,
      defaultMaterial: {
        color: config.defaultMaterial?.color ?? 0xdddddd,
        flatShading: config.defaultMaterial?.flatShading ?? true,
        metalness: config.defaultMaterial?.metalness,
        roughness: config.defaultMaterial?.roughness
      }

    };
    if (renderer) this.renderer = renderer;
  }

  /**
   * Load a model from a URL.
   * Automatically detects format from file extension.
   * 
   * @param url URL to load from
   * @param materialOverrides Optional material property overrides
   * @param onProgress Optional progress callback
   * @returns Promise resolving to load result
   */
  async loadFromUrl(
    url: string,
    materialOverrides?: MaterialProperties | THREE.Material,
    onProgress?: ProgressCallback
  ): Promise<LoadResult> {
    // Detect format from URL
    const format = this.detectFormat(url);

    // For NXS/NXZ files, use direct URL loading (streaming)
    if (format === 'nxs' || format === 'nxz') {
      const object = await this.parseNexus(url, materialOverrides as any);
      return {
        object,
        format,
        byteSize: 0 // NXS is streamed, size unknown
      };
    }

    // For other formats, fetch the file
    const response = await fetch(url, { credentials: 'include' });

    if (!response.ok) {
      throw new Error(`Failed to load model from ${url}: HTTP ${response.status}`);
    }

    // Get content length for progress tracking
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

    // Read the response with progress tracking
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      if (onProgress && contentLength > 0) {
        const percentage = (receivedLength / contentLength) * 100;
        onProgress(receivedLength, contentLength, percentage);
      }
    }

    // Concatenate chunks into single buffer
    const buffer = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, position);
      position += chunk.length;
    }

    // Load from buffer
    return this.loadFromBuffer(buffer.buffer, format, materialOverrides, url);
  }

  /**
   * Load a model from an ArrayBuffer.
   * 
   * @param buffer ArrayBuffer containing the model data
   * @param format File format ('ply', 'gltf', 'glb', 'nxs', or 'nxz')
   * @param materialOverrides Optional material property overrides
   * @param url Optional URL for streaming formats like NXS
   * @returns Promise resolving to load result
   */
  async loadFromBuffer(
    buffer: ArrayBuffer,
    format: 'ply' | 'gltf' | 'glb' | 'nxs' | 'nxz',
    materialOverrides?: MaterialProperties | THREE.Material,
    url?: string
  ): Promise<LoadResult> {
    let object: THREE.Object3D;
    
    // Extract base directory from URL if provided
    let baseDir: string | undefined;
    if (url) {
      const lastSlash = url.lastIndexOf('/');
      baseDir = lastSlash !== -1 ? url.substring(0, lastSlash + 1) : undefined;
    }

    switch (format) {
      case 'ply':
        object = await this.parsePLY(buffer, materialOverrides as any, baseDir);
        break;
      case 'gltf':
      case 'glb':
        object = await this.parseGLTF(buffer, materialOverrides as any);
        break;
      case 'nxs':
      case 'nxz':
        // For NXS/NXZ, we need the URL for streaming, not the buffer
        if (!url) {
          throw new Error('NXS/NXZ format requires URL for streaming');
        }
        object = await this.parseNexus(url, materialOverrides as any);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return {
      object,
      format,
      byteSize: buffer.byteLength
    };
  }

  /**
   * Detect file format from filename or URL
   * @param filename Filename or URL
   * @returns Detected format
   */
  detectFormat(filename: string): 'ply' | 'gltf' | 'glb' | 'nxs' | 'nxz' {
    const lower = filename.toLowerCase();

    if (lower.endsWith('.ply')) {
      return 'ply';
    } else if (lower.endsWith('.glb')) {
      return 'glb';
    } else if (lower.endsWith('.gltf')) {
      return 'gltf';
    } else if (lower.endsWith('.nxs')) {
      return 'nxs';
    } else if (lower.endsWith('.nxz')) {
      return 'nxz';
    }

    throw new Error(`Cannot detect format from filename: ${filename}`);
  }

  /**
   * Parse PLY format buffer
   * @param buffer ArrayBuffer containing PLY data
   * @param materialOverrides Optional material overrides
   * @param baseDir Optional base directory for resolving relative texture paths
   * @returns Promise resolving to Three.js Mesh
   */
  private async parsePLY(
    buffer: ArrayBuffer,
    materialOverrides?: MaterialProperties | THREE.Material,
    baseDir?: string
  ): Promise<THREE.Mesh> {
    // Lazy load PLYLoader
    if (!this.plyLoader) {
      const { PLYLoader } = await import('three/addons/loaders/PLYLoader.js');
      this.plyLoader = new PLYLoader();
    }

    // Parse geometry
    const geometry = this.plyLoader.parse(buffer);

    // print the content of the attribute texturename if present
    if (geometry.attributes.texturename) {
      const texturenameAttr = geometry.attributes.texturename;
      console.log('📦 PLY Geometry Attribute "texturename":', texturenameAttr);
    }
    
    // Parse header for possible texture name (optional)
    // From the buffer we search inside the header for the lines that start with "comment" and we log them
    const textDecoder = new TextDecoder();
    const text = textDecoder.decode(buffer);
    const headerEnd = text.indexOf('end_header');
    let foundTextureFile: string | null = null;
    if (headerEnd !== -1) {
      const headerText = text.substring(0, headerEnd);
      const headerLines = headerText.split('\n');
      console.log('📄 📄 PLY Header Comments:');
      for (const line of headerLines) {
        if (line.startsWith('comment')) {
        console.log(`  - ${line}`);
          // if after the 'comment' keyword there is the 'TextureFile' keyword, 
          // save the subsequent texture file name
          const textureFileMatch = line.match(/comment\s+TextureFile\s+(.+)/);
          if (textureFileMatch && textureFileMatch[1]) {
            foundTextureFile = textureFileMatch[1].trim();
            console.log(`  - TextureFile: ${foundTextureFile}`);
          }
        }
      }
    }
    
    // If we found a texture file name, try to load it and apply to the geometry
    let textureMap: THREE.Texture | null = null;
    if (foundTextureFile) {
      try {
        // Determine texture URL
        let textureUrl: string;
        if (foundTextureFile.startsWith('http') || foundTextureFile.startsWith('/')) {
          // Absolute path or full URL
          textureUrl = foundTextureFile;
        } else if (baseDir) {
          // Relative to the PLY file's directory
          textureUrl = baseDir + foundTextureFile;
        } else {
          // Fallback: treat as root-relative
          textureUrl = `/${foundTextureFile}`;
        }
        
        console.log(`📸 Attempting to load texture from: ${textureUrl}`);
        
        // Load the texture asynchronously
        textureMap = await new Promise((resolve, reject) => {
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load(
            textureUrl,
            (texture) => {
              console.log(`✅ Texture loaded successfully: ${foundTextureFile}`);
              resolve(texture);
            },
            undefined,
            (error) => {
              console.warn(`⚠️ Failed to load texture: ${foundTextureFile}`, error);
              reject(error);
            }
          );
        });
      } catch (error) {
        console.warn(`⚠️ Could not load texture file: ${foundTextureFile}`, error);
        textureMap = null;
      }
    }


    
    // Debug: Log all available attributes in the geometry
    console.log('📦 PLY Geometry Attributes:');
    console.log('  Attributes:', Object.keys(geometry.attributes));
    for (const [attrName, attrData] of Object.entries(geometry.attributes)) {
      const attr = attrData as any;
      console.log(`    - ${attrName}: itemSize=${attr.itemSize}, count=${attr.count}, array=${attr.array.constructor.name}`);
    }
    if (geometry.morphAttributes && Object.keys(geometry.morphAttributes).length > 0) {
      console.log('  Morph Attributes:', Object.keys(geometry.morphAttributes));
    }
    console.log('  Vertex Count:', geometry.attributes.position?.count || 0);

    // Compute normals if enabled
    if (this.config.autoComputeNormals) {
      geometry.computeVertexNormals();
    }

    // Create material with defaults and overrides
    let finalMaterial: THREE.Material;
    if (materialOverrides && (materialOverrides as any).isMaterial) {
      finalMaterial = materialOverrides as THREE.Material;
    } else {
      const materialProps = this.mergeMaterialProperties(
        this.config.defaultMaterial,
        materialOverrides as MaterialProperties
      );
      const materialConfig: any = {
        color: materialProps.color,
        flatShading: materialProps.flatShading,
        metalness: materialProps.metalness,
        roughness: materialProps.roughness
      };
      
      // Apply texture map if it was successfully loaded
      if (textureMap) {
        materialConfig.map = textureMap;
        console.log('✨ Applied texture map to material');
      }
      
      finalMaterial = new THREE.MeshStandardMaterial(materialConfig);
    }

    const mesh = new THREE.Mesh(geometry, finalMaterial);
    // Note: PLY loader does not perform normalization or centering. The mesh
    // preserves the geometry's original coordinates. Use ThreePresenter.applyTransforms
    // to position/scale the mesh in the scene, or implement scene-level normalization.
    return mesh;
  }

  /**
   * Parse GLTF/GLB format buffer
   * @param buffer ArrayBuffer containing GLTF/GLB data
   * @param materialOverrides Optional material overrides
   * @returns Promise resolving to Three.js Group
   */
  private async parseGLTF(
    buffer: ArrayBuffer,
    materialOverrides?: MaterialProperties | THREE.Material
  ): Promise<THREE.Group> {
    // Lazy load GLTF and Draco loaders
    if (!this.gltfLoader) {
      const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/loaders/DRACOLoader.js')
      ]);

      this.gltfLoader = new GLTFLoader();

      // Set up Draco decoder
      this.dracoLoader = new DRACOLoader();
      this.dracoLoader.setDecoderPath(this.config.dracoDecoderPath);
      this.dracoLoader.setDecoderConfig({ type: this.config.dracoDecoderType });
      this.gltfLoader.setDRACOLoader(this.dracoLoader);
    }

    // Parse GLTF
    return new Promise<THREE.Group>((resolve, reject) => {
      this.gltfLoader.parse(
        buffer,
        '', // Resource path (not needed for buffer parsing)
        (gltf: any) => {
          // Use the original scene group to preserve hierarchy and transforms
          const group = gltf.scene;

          // Apply material overrides if specified
          if (materialOverrides) {
            group.traverse((child: any) => {
              if ((child as THREE.Mesh).isMesh) {
                // Apply material overrides
                if ((materialOverrides as any).isMaterial) {
                  (child as THREE.Mesh).material = materialOverrides as THREE.Material;
                } else if ((child as THREE.Mesh).material) {
                  this.applyMaterialOverrides(
                    (child as THREE.Mesh).material as THREE.Material,
                    materialOverrides as MaterialProperties
                  );
                }
              }
            });
          }

          // Note: GLTF/GLB loader does not perform normalization or centering.
          // The returned group preserves transforms defined in the file. Use
          // ThreePresenter.applyTransforms or a scene-level helper to normalize/center.

          resolve(group);
        },
        (error: any) => {
          reject(new Error(`Failed to parse GLTF: ${error.message || error}`));
        }
      );
    });
  }

  /**
   * Parse Nexus (NXS/NXZ) format from URL
   * Nexus is a multiresolution format that streams data incrementally
   * @param url URL to the .nxs or .nxz file
   * @returns Promise resolving to Nexus3D
   */
  private async parseNexus(
    url: string,
    materialOverrides?: MaterialProperties | THREE.Material
  ): Promise<THREE.Object3D> {

    /* ts-ignore instruction is needed, it's not a comment!!! */
    // @ts-ignore
    const nexusMod = await import('nexus3d');

    // Ensure we have a renderer to pass to Nexus3D
    const rendererToUse = this.renderer;
    if (!rendererToUse) {
      throw new Error('Nexus3D requires a WebGLRenderer instance; please provide it when creating ModelLoader');
    }

    const nexusAny: any = nexusMod;
    const Nexus3D = nexusAny.Nexus3D || nexusAny.default || nexusAny.NexusObject || nexusAny.Nexus;

    if (!Nexus3D) {
      throw new Error('Unable to locate Nexus3D export from nexus3d package');
    }

    // Create a Nexus3D instance with the signature: (url, renderer, options)
    // Return a Promise that resolves when the Nexus model finishes its initial load
    // (onLoad). This keeps behavior consistent with other parsers and allows the
    // caller to frame the scene using the actual geometry when it becomes available.
    return await new Promise<THREE.Object3D>((resolve, reject) => {
      let loadTimeout: ReturnType<typeof setTimeout> | null = null;

      // Determine material if provided as a runtime material or as material properties.
      let providedMaterial: THREE.Material | undefined;
      let materialProps: MaterialProperties | undefined = undefined;
      if (materialOverrides) {
        if ((materialOverrides as any).isMaterial) {
          providedMaterial = materialOverrides as THREE.Material;
        } else {
          materialProps = materialOverrides as MaterialProperties;
        }
      }

      const nxs = new Nexus3D(url, rendererToUse, {
        onLoad: (nexus: any) => {
          try {
            // Populate geometry bounding data from Nexus boundingSphere (raw coordinates)
            if (nexus.boundingSphere && nexus.geometry) {
              const bs = nexus.boundingSphere;
              if (!nexus.geometry.boundingSphere) nexus.geometry.boundingSphere = new THREE.Sphere();
              nexus.geometry.boundingSphere.center.copy(bs.center);
              nexus.geometry.boundingSphere.radius = bs.radius;
              if (!nexus.geometry.boundingBox) nexus.geometry.boundingBox = new THREE.Box3();
              const min = new THREE.Vector3(bs.center.x - bs.radius, bs.center.y - bs.radius, bs.center.z - bs.radius);
              const max = new THREE.Vector3(bs.center.x + bs.radius, bs.center.y + bs.radius, bs.center.z + bs.radius);
              nexus.geometry.boundingBox.set(min, max);
              console.log('ℹ️ Nexus loader: geometry bounds set from boundingSphere', { center: bs.center.toArray(), radius: bs.radius });
              console.log('Nexus Triangle Count at full resolution:', nexus.mesh.facesCount);
            }
          } catch (e) {
            console.warn('Error while populating nexus geometry bounds on load', e);
          }

          if (loadTimeout) {
            clearTimeout(loadTimeout);
            loadTimeout = null;
          }

          // If a runtime material instance is provided, assign it to all meshes
          try {
            if (providedMaterial) {
              (nxs as any).traverse((c: any) => {
                if (c.isMesh) c.material = providedMaterial;
              });
            } else if (materialProps) {
              // Create a shared material instance from provided properties and set on meshes
              const merged = this.mergeMaterialProperties(this.config.defaultMaterial, materialProps);
              const sharedMat = new THREE.MeshStandardMaterial({
                color: merged.color,
                metalness: merged.metalness,
                roughness: merged.roughness,
                flatShading: merged.flatShading
              });
              (nxs as any).traverse((c: any) => {
                if (c.isMesh) c.material = sharedMat;
              });
            }
          } catch (e) {
            console.warn('Error applying material overrides on nexus onLoad', e);
          }

          console.log('✅ Nexus model loaded:', url);
          resolve(nxs);
        },
        onUpdate: (nexus: any) => {
          try {
            // Refresh geometry bounding data if Nexus updates it during streaming
            if (nexus.boundingSphere && nexus.geometry) {
              const bs = nexus.boundingSphere;
              if (!nexus.geometry.boundingSphere) nexus.geometry.boundingSphere = new THREE.Sphere();
              nexus.geometry.boundingSphere.center.copy(bs.center);
              nexus.geometry.boundingSphere.radius = bs.radius;
              if (!nexus.geometry.boundingBox) nexus.geometry.boundingBox = new THREE.Box3();
              const min = new THREE.Vector3(bs.center.x - bs.radius, bs.center.y - bs.radius, bs.center.z - bs.radius);
              const max = new THREE.Vector3(bs.center.x + bs.radius, bs.center.y + bs.radius, bs.center.z + bs.radius);
              nexus.geometry.boundingBox.set(min, max);
              console.log('🔄 Nexus model updated bounds:', { center: bs.center.toArray(), radius: bs.radius });
            }
          } catch (e) {
            console.warn('Error while updating nexus geometry bounds on update', e);
          }
          // Re-apply material overrides in case streaming replaced meshes or materials
          try {
            if (providedMaterial) {
              (nexus as any).traverse((c: any) => {
                if (c.isMesh) c.material = providedMaterial;
              });
            } else if (materialProps) {
              const merged = this.mergeMaterialProperties(this.config.defaultMaterial, materialProps);
              (nexus as any).traverse((c: any) => {
                if (c.isMesh) {
                  // If the material is a MeshStandardMaterial, apply overrides
                  if (c.material) {
                    this.applyMaterialOverrides(c.material, merged);
                  } else {
                    const m = new THREE.MeshStandardMaterial({
                      color: merged.color,
                      metalness: merged.metalness,
                      roughness: merged.roughness,
                      flatShading: merged.flatShading
                    });
                    c.material = m;
                  }
                }
              });
            }
          } catch (e) {
            console.warn('Error applying material overrides on nexus update', e);
          }
        },
        onProgress: () => { },
        onError: (error: any) => {
          if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null; }
          console.error('❌ Nexus model failed to load:', url, error);
          reject(new Error(`Failed to load Nexus model: ${error}`));
        }
      }, providedMaterial);

      // Set a timeout to prevent hanging if the onLoad never fires
      loadTimeout = setTimeout(() => {
        console.warn('⏱️ Nexus load timeout, resolving with partial object:', url);
        // Resolve with whatever we have been returned, but it's not fully loaded.
        // This avoids blocking the presenter indefinitely; the onUpdate handler still updates bounds.
        resolve(nxs);
      }, 30000);

      console.log('🔄 Nexus model created, initial streaming will begin automatically:', url);
    });
  }

  /**
   * Apply material property overrides to an existing material
   * @param material Three.js material to modify
   * @param overrides Properties to override
   */
  private applyMaterialOverrides(
    material: THREE.Material,
    overrides: MaterialProperties
  ): void {
    const mat = material as any;

    if (mat.color && overrides.color !== undefined) {
      mat.color = new THREE.Color(overrides.color);
    }

    if (mat.metalness !== undefined && overrides.metalness !== undefined) {
      mat.metalness = overrides.metalness;
    }

    if (mat.roughness !== undefined && overrides.roughness !== undefined) {
      mat.roughness = overrides.roughness;
    }

    if (overrides.flatShading !== undefined) {
      mat.flatShading = overrides.flatShading;
      mat.needsUpdate = true;
    }
  }

  /**
   * Merge material properties, with overrides taking precedence
   * @param defaults Default properties
   * @param overrides Override properties
   * @returns Merged properties
   */
  private mergeMaterialProperties(
    defaults: MaterialProperties,
    overrides?: MaterialProperties
  ): Required<MaterialProperties> {
    return {
      color: overrides?.color ?? defaults.color ?? 0xdddddd,
      flatShading: overrides?.flatShading ?? defaults.flatShading ?? true,
      metalness: overrides?.metalness ?? defaults.metalness ?? 0.5,
      roughness: overrides?.roughness ?? defaults.roughness ?? 0.5
    };
  }

  /**
   * Get the current configuration
   */
  getConfig(): Readonly<Required<LoaderConfig>> {
    return { ...this.config };
  }

  /**
   * Update the Draco decoder path
   * @param path New path to Draco decoder
   */
  setDracoDecoderPath(path: string): void {
    this.config.dracoDecoderPath = path;
    if (this.dracoLoader) {
      this.dracoLoader.setDecoderPath(path);
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
      this.dracoLoader = null;
    }
    this.plyLoader = null;
    this.gltfLoader = null;
  }
}

/**
 * Convenience function to create a model loader with default configuration
 */
export function createModelLoader(config?: LoaderConfig): ModelLoader {
  return new ModelLoader(config);
}
