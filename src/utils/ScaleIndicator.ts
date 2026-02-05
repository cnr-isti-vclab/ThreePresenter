import * as THREE from 'three';

/**
 * Configuration for the scale indicator (ruler)
 */
export interface ScaleIndicatorConfig {
  /** Unit label (e.g., 'meters', 'cm', 'inches') */
  unit?: string;
  /** Size of the ruler in world units (default: 1) */
  rulerSize?: number;
  /** Number of segments/divisions (checkerboard squares) */
  segments?: number;
  /** Height of the scale bar in world units (default: rulerSize/10) */
  barHeight?: number;
  /** Thickness/depth of the bar (default: 0.01) */
  barThickness?: number;
  /** Text height for labels (default: rulerSize/10) */
  textHeight?: number;
  /** Primary color (light squares) */
  lightColor?: number;
  /** Secondary color (dark squares) */
  darkColor?: number;
  /** Text color (default: 0x000000 - black) */
  textColor?: number;
}

/**
 * ScaleIndicator - Displays a photographic-style checkerboard scale bar
 * 
 * This utility creates a visual scale reference similar to photography scale bars,
 * helping users understand the real-world size of 3D models.
 * 
 * The scale bar displays:
 * - A checkerboard pattern with alternating light/dark squares
 * - Clear numerical labels at intervals
 * - Unit label (meters, cm, etc.)
 * - Positioned on the ground plane (XZ plane)
 * 
 * Features:
 * - Photography-style checkerboard pattern for high visibility
 * - Configurable unit labels (meters, cm, inches, etc.)
 * - Customizable size, segments, and colors
 * - Canvas-based text rendering for crisp labels
 * 
 * @example
 * ```typescript
 * const indicator = new ScaleIndicator(scene, {
 *   unit: 'meters',
 *   rulerSize: 1,
 *   segments: 10,
 *   lightColor: 0xffffff,
 *   darkColor: 0x000000
 * });
 * 
 * // Later, update or remove
 * indicator.remove();
 * ```
 */
export class ScaleIndicator {
  private group: THREE.Group;
  private config: Required<ScaleIndicatorConfig>;

  constructor(
    private scene: THREE.Scene,
    config: ScaleIndicatorConfig = {}
  ) {
    const rulerSize = config.rulerSize ?? 1;
    
    this.config = {
      unit: config.unit ?? 'units',
      rulerSize: rulerSize,
      segments: config.segments ?? 10,
      barHeight: config.barHeight ?? rulerSize / 10,
      barThickness: config.barThickness ?? 0.001,
      textHeight: config.textHeight ?? rulerSize / 15,
      lightColor: config.lightColor ?? 0xffffff,
      darkColor: config.darkColor ?? 0x000000,
      textColor: config.textColor ?? 0x000000
    };

    this.group = new THREE.Group();
    this.group.name = 'ScaleIndicator';
    this.createCheckerboardBar();
    this.scene.add(this.group);
  }

  /**
   * Create a checkerboard-style scale bar (like photography reference scales)
   */
  private createCheckerboardBar() {
    const { rulerSize, segments, barHeight, barThickness, lightColor, darkColor } = this.config;
    const segmentWidth = rulerSize / segments;

    // Create checkerboard pattern
    for (let i = 0; i < segments; i++) {
      const x = i * segmentWidth;
      const color = i % 2 === 0 ? lightColor : darkColor;
      
      // Create a box for each square
      const geometry = new THREE.BoxGeometry(segmentWidth, barThickness, barHeight);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.8,
        metalness: 0.1
      });
      
      const square = new THREE.Mesh(geometry, material);
      // Position: center the segment in X, slightly above ground, center in Z
      square.position.set(x + segmentWidth / 2, barThickness / 2 + 0.001, 0);
      this.group.add(square);
    }

    // Add border frame for better definition
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
    const borderPoints = [
      new THREE.Vector3(0, 0.002, -barHeight / 2),
      new THREE.Vector3(rulerSize, 0.002, -barHeight / 2),
      new THREE.Vector3(rulerSize, 0.002, barHeight / 2),
      new THREE.Vector3(0, 0.002, barHeight / 2),
      new THREE.Vector3(0, 0.002, -barHeight / 2)
    ];
    const borderGeometry = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const border = new THREE.Line(borderGeometry, borderMaterial);
    this.group.add(border);

    // Add numeric labels at key intervals
    this.addNumericLabels();

    // Add unit label
    this.addUnitLabel();

    console.log(`📏 Scale indicator created: ${rulerSize} ${this.config.unit} (${segments} segments)`);
  }

  /**
   * Add numeric labels to the scale bar
   */
  private addNumericLabels() {
    const { rulerSize, segments, barHeight, textHeight } = this.config;
    const segmentWidth = rulerSize / segments;
    
    // Add labels at intervals (0, middle, end, and maybe quarters)
    const labelPositions: number[] = [0];
    
    // Add intermediate labels based on ruler size
    if (segments >= 4) {
      const numLabels = Math.min(5, Math.floor(segments / 2));
      for (let i = 1; i < numLabels; i++) {
        labelPositions.push(i * segments / numLabels);
      }
    }
    labelPositions.push(segments);

    labelPositions.forEach(segment => {
      const x = segment * segmentWidth;
      const value = (segment / segments) * rulerSize;
      const text = value.toFixed(value < 1 ? 2 : value < 10 ? 1 : 0);
      
      const label = this.createTextPlane(text, textHeight * 0.8);
      // Position flat on the ground, slightly above the bar
      label.position.set(x, 0.003, barHeight / 2 + textHeight * 0.5);
      this.group.add(label);

      // Add small tick mark
      const tickPoints = [
        new THREE.Vector3(x, 0.002, -barHeight / 2),
        new THREE.Vector3(x, 0.002, -barHeight / 2 - textHeight * 0.3)
      ];
      const tickGeometry = new THREE.BufferGeometry().setFromPoints(tickPoints);
      const tickMaterial = new THREE.LineBasicMaterial({ color: this.config.textColor });
      const tick = new THREE.Line(tickGeometry, tickMaterial);
      this.group.add(tick);
    });
  }

  /**
   * Add unit label below the scale bar
   */
  private addUnitLabel() {
    const { rulerSize, barHeight, textHeight, unit } = this.config;
    
    const unitLabel = this.createTextPlane(unit, textHeight);
    // Position flat on the ground, below the bar
    unitLabel.position.set(rulerSize / 2, 0.003, -barHeight / 2 - textHeight * 0.7);
    this.group.add(unitLabel);
  }

  /**
   * Create a flat text plane using canvas rendering (aligned to ground, not billboarded)
   */
  private createTextPlane(text: string, height: number): THREE.Mesh {
    // Create canvas for text rendering
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // High resolution for crisp text
    canvas.width = 1024;
    canvas.height = 256;

    // Draw text with background for better visibility
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text styling
    ctx.fillStyle = `#${this.config.textColor.toString(16).padStart(6, '0')}`;
    ctx.font = 'bold 120px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create plane geometry with proper aspect ratio
    const aspectRatio = canvas.width / canvas.height;
    const geometry = new THREE.PlaneGeometry(height * aspectRatio, height);
    
    // Create material with the text texture
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false
    });
    
    const plane = new THREE.Mesh(geometry, material);
    // Rotate to lie flat on the ground (XZ plane)
    plane.rotation.x = -Math.PI / 2;

    return plane;
  }

  /**
   * Update the scale bar configuration
   */
  update(config: Partial<ScaleIndicatorConfig>) {
    Object.assign(this.config, config);
    this.group.clear();
    this.createCheckerboardBar();
  }

  /**
   * Update scale bar position
   */
  setPosition(x: number, y: number, z: number) {
    this.group.position.set(x, y, z);
  }

  /**
   * Rotate the scale bar around its center
   * @param angleRadians Rotation angle in radians (around Y axis)
   */
  setRotation(angleRadians: number) {
    this.group.rotation.y = angleRadians;
  }

  /**
   * Remove the scale indicator from the scene and clean up resources
   */
  remove() {
    this.scene.remove(this.group);
    
    // Clean up all geometries and materials
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Sprite) {
        if ('geometry' in child) {
          (child as any).geometry?.dispose();
        }
        if ('material' in child) {
          const mat = (child as any).material;
          if (mat) {
            // Dispose of textures
            if ('map' in mat && mat.map) mat.map.dispose();
            // Dispose of material
            if (mat instanceof THREE.Material) {
              mat.dispose();
            } else if (Array.isArray(mat)) {
              mat.forEach(m => m?.dispose());
            }
          }
        }
      }
    });
    
    this.group.clear();
  }

  /**
   * Get the scale bar group for advanced modifications
   */
  getGroup(): THREE.Group {
    return this.group;
  }
}
