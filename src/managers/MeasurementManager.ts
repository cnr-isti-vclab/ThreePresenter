import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export interface MeasurementConfig {
  /** Unit suffix shown in labels */
  unit?: string;
  /** Number of decimals in labels */
  precision?: number;
  /** Color of measurement lines */
  lineColor?: number;
  /** Color of picked points */
  pointColor?: number;
  /** Radius for point markers */
  pointRadius?: number;
}

export interface MeasurementRecord {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  distance: number;
  label: string;
}

interface MeasurementEntry {
  record: MeasurementRecord;
  group: THREE.Group;
}

const DEFAULT_CONFIG: Required<MeasurementConfig> = {
  unit: 'units',
  precision: 3,
  lineColor: 0x00e0ff,
  pointColor: 0x00e0ff,
  pointRadius: 0.01
};

/**
 * Manages two-click distance measurements in the scene.
 * First click stores a start point, second click creates a persistent measurement.
 */
export class MeasurementManager {
  private config: Required<MeasurementConfig>;
  private entries = new Map<string, MeasurementEntry>();
  private pendingStart: THREE.Vector3 | null = null;
  private pendingMarker: THREE.Mesh | null = null;
  private idCounter = 0;

  constructor(private scene: THREE.Scene, config: MeasurementConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add a picked point. Returns a measurement only when this call completes a pair.
   */
  addPoint(point: THREE.Vector3 | [number, number, number]): MeasurementRecord | null {
    const p = Array.isArray(point) ? new THREE.Vector3(point[0], point[1], point[2]) : point.clone();

    if (!this.pendingStart) {
      this.pendingStart = p;
      this.setPendingMarker(p);
      return null;
    }

    const start = this.pendingStart.clone();
    const end = p.clone();
    this.pendingStart = null;
    this.clearPendingMarker();

    const distance = start.distanceTo(end);
    const label = `${distance.toFixed(this.config.precision)} ${this.config.unit}`;
    const id = `measurement-${++this.idCounter}`;

    const record: MeasurementRecord = {
      id,
      start: [start.x, start.y, start.z],
      end: [end.x, end.y, end.z],
      distance,
      label
    };

    const group = this.createMeasurementGroup(start, end, label, distance);
    this.scene.add(group);
    this.entries.set(id, { record, group });
    return record;
  }

  clear(): void {
    this.cancelPending();
    for (const entry of this.entries.values()) {
      this.disposeObject(entry.group);
      this.scene.remove(entry.group);
    }
    this.entries.clear();
  }

  cancelPending(): void {
    this.pendingStart = null;
    this.clearPendingMarker();
  }

  getAll(): MeasurementRecord[] {
    return Array.from(this.entries.values()).map(e => e.record);
  }

  dispose(): void {
    this.clear();
  }

  private setPendingMarker(position: THREE.Vector3): void {
    this.clearPendingMarker();
    const marker = this.createPointMarker(position);
    this.pendingMarker = marker;
    this.scene.add(marker);
  }

  private clearPendingMarker(): void {
    if (!this.pendingMarker) return;
    this.disposeObject(this.pendingMarker);
    this.scene.remove(this.pendingMarker);
    this.pendingMarker = null;
  }

  private createMeasurementGroup(
    start: THREE.Vector3,
    end: THREE.Vector3,
    label: string,
    distance: number
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = 'Measurement';

    const startMarker = this.createPointMarker(start);
    const endMarker = this.createPointMarker(end);
    group.add(startMarker, endMarker);

    const lineGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const lineMaterial = new THREE.LineBasicMaterial({ color: this.config.lineColor });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    group.add(line);

    const mid = start.clone().add(end).multiplyScalar(0.5);
    const labelSprite = this.createLabelObject(label);
    const offset = Math.max(distance * 0.02, 0.01);
    labelSprite.position.set(mid.x, mid.y + offset, mid.z);
    group.add(labelSprite);

    return group;
  }

  private createPointMarker(position: THREE.Vector3): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(this.config.pointRadius, 12, 12);
    const material = new THREE.MeshBasicMaterial({ color: this.config.pointColor });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(position);
    return marker;
  }

  private createLabelObject(text: string): CSS2DObject {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.padding = '3px 8px';
    el.style.borderRadius = '6px';
    el.style.border = '1px solid rgba(255,255,255,0.8)';
    el.style.background = 'rgba(0,0,0,0.75)';
    el.style.color = '#fff';
    el.style.fontFamily = 'system-ui, Arial, sans-serif';
    el.style.fontSize = '12px';
    el.style.fontWeight = '600';
    el.style.whiteSpace = 'nowrap';
    el.style.pointerEvents = 'none';
    return new CSS2DObject(el);
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      const asAny = child as any;
      if (asAny.geometry && typeof asAny.geometry.dispose === 'function') {
        asAny.geometry.dispose();
      }
      if (asAny.material) {
        const mats = Array.isArray(asAny.material) ? asAny.material : [asAny.material];
        mats.forEach((m: any) => {
          if (m?.map && typeof m.map.dispose === 'function') m.map.dispose();
          if (m?.dispose && typeof m.dispose === 'function') m.dispose();
        });
      }
      if (asAny.element && asAny.element.parentNode) {
        asAny.element.parentNode.removeChild(asAny.element);
      }
    });
  }
}
