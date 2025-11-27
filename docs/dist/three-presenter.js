var x = Object.defineProperty;
var k = (h, t, e) => t in h ? x(h, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : h[t] = e;
var a = (h, t, e) => k(h, typeof t != "symbol" ? t + "" : t, e);
import * as r from "three";
const S = {
  color: 16776960,
  // Yellow
  selectedColor: 16777062,
  // Brighter yellow
  opacity: 0.9,
  // Slightly transparent
  selectedOpacity: 1,
  // Fully opaque
  markerSize: 10,
  // 10 pixels
  sphereSegments: 16
  // Good balance of quality/performance
};
class E {
  /**
   * Create a new AnnotationManager
   * @param scene - The Three.js scene to add markers to
   * @param config - Optional configuration for appearance and behavior
   */
  constructor(t, e = {}) {
    a(this, "scene");
    a(this, "config");
    // Annotation state
    a(this, "markers", /* @__PURE__ */ new Map());
    a(this, "selectedIds", /* @__PURE__ */ new Set());
    a(this, "annotations", []);
    // Callbacks
    a(this, "selectionCallbacks", []);
    a(this, "pickCallback", null);
    this.scene = t, this.config = { ...S, ...e };
  }
  /**
   * Render annotations as 3D markers in the scene
   * @param annotations - Array of annotations to render
   */
  render(t) {
    this.annotations = t;
    const e = new Set(t.map((i) => i.id));
    for (const [i, o] of this.markers.entries())
      e.has(i) || this.removeMarker(i);
    t.forEach((i) => {
      if (i.type !== "point") return;
      const o = i.geometry, n = new r.Vector3(o[0], o[1], o[2]);
      let s = this.markers.get(i.id);
      const c = this.selectedIds.has(i.id);
      s ? (s.position.copy(n), this.updateMarkerAppearance(s, c)) : (s = this.createMarker(n, c), this.markers.set(i.id, s), this.scene.add(s));
    }), console.log(`🎯 AnnotationManager: Rendered ${t.length} annotation(s)`);
  }
  /**
   * Select one or more annotations
   * @param ids - Array of annotation IDs to select
   * @param additive - If true, add to selection; if false, replace selection
   */
  select(t, e = !1) {
    e || this.selectedIds.clear(), t.forEach((i) => this.selectedIds.add(i)), this.updateAllMarkerAppearances(), this.notifySelectionChange(), console.log(`✅ AnnotationManager: Selected ${t.length} annotation(s) (total: ${this.selectedIds.size})`);
  }
  /**
   * Toggle selection state of an annotation
   * @param id - Annotation ID to toggle
   */
  toggleSelection(t) {
    this.selectedIds.has(t) ? (this.selectedIds.delete(t), console.log(`❌ AnnotationManager: Deselected ${t}`)) : (this.selectedIds.add(t), console.log(`✅ AnnotationManager: Selected ${t}`)), this.updateAllMarkerAppearances(), this.notifySelectionChange();
  }
  /**
   * Clear all selections
   */
  clearSelection() {
    this.selectedIds.size > 0 && (this.selectedIds.clear(), this.updateAllMarkerAppearances(), this.notifySelectionChange(), console.log("🗑️ AnnotationManager: Cleared selection"));
  }
  /**
   * Get array of selected annotation IDs
   */
  getSelected() {
    return Array.from(this.selectedIds);
  }
  /**
   * Check if an annotation is selected
   */
  isSelected(t) {
    return this.selectedIds.has(t);
  }
  /**
   * Update marker scales for consistent screen-space size
   * Should be called in the render loop
   * @param camera - Current camera (perspective or orthographic)
   * @param canvasHeight - Height of the canvas in pixels
   */
  updateMarkerScales(t, e) {
    const i = this.config.markerSize;
    for (const o of this.markers.values()) {
      let n;
      if (t instanceof r.PerspectiveCamera) {
        const s = t.position.distanceTo(o.position), c = t.fov * Math.PI / 180;
        n = s * Math.tan(c / 2) * 2 * i / e;
      } else t instanceof r.OrthographicCamera ? n = (t.top - t.bottom) * i / e : n = 0.01;
      o.scale.set(n, n, n);
    }
  }
  /**
   * Get the marker mesh for an annotation (for raycasting)
   */
  getMarker(t) {
    return this.markers.get(t);
  }
  /**
   * Get all marker meshes (for raycasting)
   */
  getAllMarkers() {
    return Array.from(this.markers.values());
  }
  /**
   * Find annotation ID from a marker mesh
   */
  getAnnotationIdFromMarker(t) {
    for (const [e, i] of this.markers.entries())
      if (i === t) return e;
    return null;
  }
  /**
   * Register a callback for selection changes
   * @param callback - Function to call when selection changes
   * @returns Unsubscribe function
   */
  onSelectionChange(t) {
    return this.selectionCallbacks.push(t), () => {
      const e = this.selectionCallbacks.indexOf(t);
      e > -1 && this.selectionCallbacks.splice(e, 1);
    };
  }
  /**
   * Enable picking mode for creating new annotations
   * @param callback - Function to call when a point is picked
   */
  enablePicking(t) {
    this.pickCallback = t, console.log("✏️ AnnotationManager: Picking mode enabled");
  }
  /**
   * Disable picking mode
   */
  disablePicking() {
    this.pickCallback = null, console.log("✏️ AnnotationManager: Picking mode disabled");
  }
  /**
   * Check if picking mode is active
   */
  isPickingMode() {
    return this.pickCallback !== null;
  }
  /**
   * Notify picking callback with a point
   * @param point - 3D point coordinates
   */
  notifyPointPicked(t) {
    this.pickCallback && (this.pickCallback(t), console.log("📍 AnnotationManager: Point picked:", t));
  }
  /**
   * Update configuration
   * @param config - Partial configuration to merge with current config
   */
  updateConfig(t) {
    this.config = { ...this.config, ...t }, this.updateAllMarkerAppearances();
  }
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Dispose of all resources
   */
  dispose() {
    for (const [t, e] of this.markers.entries())
      this.removeMarker(t);
    this.selectionCallbacks = [], this.pickCallback = null, console.log("🗑️ AnnotationManager: Disposed");
  }
  // ==================== Private Methods ====================
  /**
   * Create a new marker mesh
   */
  createMarker(t, e) {
    const i = new r.SphereGeometry(1, this.config.sphereSegments, this.config.sphereSegments), o = new r.MeshBasicMaterial({
      color: e ? this.config.selectedColor : this.config.color,
      transparent: !0,
      opacity: e ? this.config.selectedOpacity : this.config.opacity,
      depthTest: !0,
      depthWrite: !0
    }), n = new r.Mesh(i, o);
    return n.position.copy(t), n;
  }
  /**
   * Update a marker's appearance based on selection state
   */
  updateMarkerAppearance(t, e) {
    const i = t.material;
    i.color.setHex(e ? this.config.selectedColor : this.config.color), i.opacity = e ? this.config.selectedOpacity : this.config.opacity;
  }
  /**
   * Update all markers' appearances based on current selection
   */
  updateAllMarkerAppearances() {
    for (const [t, e] of this.markers.entries()) {
      const i = this.selectedIds.has(t);
      this.updateMarkerAppearance(e, i);
    }
  }
  /**
   * Remove a marker from the scene
   */
  removeMarker(t) {
    const e = this.markers.get(t);
    e && (this.scene.remove(e), e.geometry.dispose(), e.material.dispose(), this.markers.delete(t));
  }
  /**
   * Notify all selection change callbacks
   */
  notifySelectionChange() {
    const t = this.getSelected();
    this.selectionCallbacks.forEach((e) => {
      try {
        e(t);
      } catch (i) {
        console.error("Error in selection change callback:", i);
      }
    });
  }
}
class I {
  resolve(t, e) {
    return t.startsWith("http://") || t.startsWith("https://"), t;
  }
}
class P {
  constructor(t) {
    this.baseUrl = t, this.baseUrl = t.replace(/\/$/, "");
  }
  resolve(t, e) {
    if (t.startsWith("http://") || t.startsWith("https://"))
      return t;
    const i = t.startsWith("/") ? t.slice(1) : t;
    return `${this.baseUrl}/${i}`;
  }
}
class T {
  constructor(t) {
    this.resolveFn = t;
  }
  resolve(t, e) {
    return this.resolveFn(t, e);
  }
}
function z(h) {
  let t = 0, e = 0;
  const i = /* @__PURE__ */ new Set();
  h.traverse((c) => {
    if (c.isMesh) {
      const l = c, d = l.geometry;
      if (d) {
        const g = d.getAttribute("position");
        g && (e += g.count), d.index ? t += d.index.count / 3 : g && (t += g.count / 3);
      }
      l.material && (Array.isArray(l.material) ? l.material : [l.material]).forEach((p) => {
        const m = p;
        [
          "map",
          "normalMap",
          "roughnessMap",
          "metalnessMap",
          "aoMap",
          "emissiveMap",
          "bumpMap",
          "displacementMap",
          "alphaMap",
          "lightMap",
          "envMap"
        ].forEach((u) => {
          m[u] && m[u] instanceof r.Texture && i.add(m[u]);
        });
      });
    }
  });
  const o = [];
  i.forEach((c) => {
    if (c.image) {
      const l = c.image.width || 0, d = c.image.height || 0;
      o.push({ width: l, height: d });
    }
  });
  const s = new r.Box3().setFromObject(h).getSize(new r.Vector3());
  return {
    triangles: Math.floor(t),
    vertices: e,
    bbox: {
      x: s.x,
      y: s.y,
      z: s.z
    },
    textures: {
      count: i.size,
      dimensions: o
    }
  };
}
function B(h) {
  const t = new r.Box3();
  return h.forEach((e) => {
    const i = new r.Box3().setFromObject(e);
    t.union(i);
  }), t;
}
function F(h) {
  const t = h.getSize(new r.Vector3());
  return Math.max(t.x, t.y, t.z);
}
function V(h, t, e = 1.2) {
  const i = t * (Math.PI / 180);
  return h / 2 / Math.tan(i / 2) * e;
}
function G(h) {
  const t = new r.Box3().setFromObject(h), e = t.getCenter(new r.Vector3());
  return new r.Vector3(
    -e.x,
    -t.min.y,
    // Align bottom to ground
    -e.z
  );
}
function $(h) {
  const t = B(h), e = t.getCenter(new r.Vector3());
  return new r.Vector3(
    -e.x,
    -t.min.y,
    -e.z
  );
}
function H(h) {
  return Array.isArray(h) && h.length === 3;
}
function R(h, t = 3) {
  return [
    parseFloat(h.x.toFixed(t)),
    parseFloat(h.y.toFixed(t)),
    parseFloat(h.z.toFixed(t))
  ];
}
function j(h) {
  const t = (i) => i >= 1e6 ? `${(i / 1e6).toFixed(1)}M` : i >= 1e3 ? `${(i / 1e3).toFixed(1)}K` : `${i}`, e = (i) => i.toFixed(1);
  return `${t(h.triangles)} triangles, ${t(h.vertices)} vertices, ${e(h.bbox.x)} x ${e(h.bbox.y)} x ${e(h.bbox.z)}m, ${h.textures.count} texture${h.textures.count !== 1 ? "s" : ""}`;
}
class M {
  constructor() {
    a(this, "containerConfig", {
      position: "top-left",
      direction: "vertical",
      gap: "gap-2",
      zIndex: "1000"
    });
    a(this, "buttons", []);
  }
  /**
   * Configure the button container
   */
  setContainer(t) {
    return this.containerConfig = { ...this.containerConfig, ...t }, this;
  }
  /**
   * Add a button to the control panel
   */
  addButton(t) {
    return this.buttons.push(t), this;
  }
  /**
   * Add multiple buttons at once
   */
  addButtons(t) {
    return this.buttons.push(...t), this;
  }
  /**
   * Build the UI controls and return the result
   */
  build() {
    const t = this.createContainer(), e = /* @__PURE__ */ new Map();
    for (const i of this.buttons) {
      const o = this.createButton(i);
      t.appendChild(o), e.set(i.id, o);
    }
    return {
      container: t,
      buttons: e
    };
  }
  /**
   * Create the container element
   */
  createContainer() {
    const t = document.createElement("div"), e = ["position-absolute", "d-flex"], i = this.getPositionClasses(this.containerConfig.position), o = this.containerConfig.direction === "horizontal" ? "flex-row" : "flex-column", n = this.containerConfig.gap || "gap-2", c = [
      ...e,
      ...i,
      o,
      n,
      "m-2",
      this.containerConfig.className || ""
    ].filter((l) => l.length > 0);
    return t.className = c.join(" "), t.style.zIndex = this.containerConfig.zIndex || "1000", t;
  }
  /**
   * Get Bootstrap positioning classes based on position config
   */
  getPositionClasses(t) {
    switch (t) {
      case "top-left":
        return ["top-0", "start-0"];
      case "top-right":
        return ["top-0", "end-0"];
      case "bottom-left":
        return ["bottom-0", "start-0"];
      case "bottom-right":
        return ["bottom-0", "end-0"];
      default:
        return ["top-0", "start-0"];
    }
  }
  /**
   * Create a single button element
   */
  createButton(t) {
    const e = document.createElement("button");
    t.customHTML ? e.innerHTML = t.customHTML : e.innerHTML = `<i class="bi ${t.icon}"></i>`;
    const o = [...[
      "btn",
      "btn-light",
      "p-2",
      "shadow-sm",
      "rounded",
      "align-items-center",
      "justify-content-center"
    ], t.className || ""].filter((n) => n.length > 0);
    return e.className = o.join(" "), e.title = t.title, t.visible === !1 ? e.style.display = "none" : e.style.display = "flex", e.addEventListener("mouseenter", () => {
      e.style.transform = "scale(1.05)";
    }), e.addEventListener("mouseleave", () => {
      e.style.transform = "scale(1)";
    }), e.addEventListener("click", t.onClick), e;
  }
  /**
   * Reset the builder to initial state
   */
  reset() {
    return this.buttons = [], this.containerConfig = {
      position: "top-left",
      direction: "vertical",
      gap: "gap-2",
      zIndex: "1000"
    }, this;
  }
}
function N(h) {
  const t = new M();
  return t.addButton(h), t.build().buttons.get(h.id);
}
function U(h, t) {
  const e = new M();
  return e.setContainer(h), e.addButtons(t), e.build();
}
class v {
  /**
   * Create a new CameraManager
   * 
   * @param aspect Initial aspect ratio (width / height)
   * @param config Camera configuration
   */
  constructor(t, e = {}) {
    a(this, "perspectiveCamera");
    a(this, "orthographicCamera");
    a(this, "activeCamera");
    a(this, "isOrthographic", !1);
    a(this, "initialPosition");
    a(this, "initialTarget");
    a(this, "frustumSize");
    a(this, "currentAspect");
    const {
      fov: i = 40,
      near: o = 0.1,
      far: n = 1e3,
      frustumSize: s = 2,
      initialPosition: c = new r.Vector3(0, 0, 2),
      initialTarget: l = new r.Vector3(0, 0, 0)
    } = e;
    this.currentAspect = t, this.frustumSize = s, this.initialPosition = c.clone(), this.initialTarget = l.clone(), this.perspectiveCamera = new r.PerspectiveCamera(i, t, o, n), this.perspectiveCamera.position.copy(c), this.orthographicCamera = new r.OrthographicCamera(
      s * t / -2,
      s * t / 2,
      s / 2,
      s / -2,
      o,
      n
    ), this.orthographicCamera.position.copy(c), this.activeCamera = this.perspectiveCamera;
  }
  /**
   * Get the currently active camera
   */
  getActiveCamera() {
    return this.activeCamera;
  }
  /**
   * Get the perspective camera
   */
  getPerspectiveCamera() {
    return this.perspectiveCamera;
  }
  /**
   * Get the orthographic camera
   */
  getOrthographicCamera() {
    return this.orthographicCamera;
  }
  /**
   * Check if currently using orthographic camera
   */
  isOrthographicMode() {
    return this.isOrthographic;
  }
  /**
   * Get current camera type
   */
  getCameraType() {
    return this.isOrthographic ? "orthographic" : "perspective";
  }
  /**
   * Get camera information
   */
  getCameraInfo() {
    const t = {
      type: this.getCameraType(),
      position: this.activeCamera.position.clone()
    };
    return this.isOrthographic ? t.frustum = {
      left: this.orthographicCamera.left,
      right: this.orthographicCamera.right,
      top: this.orthographicCamera.top,
      bottom: this.orthographicCamera.bottom
    } : t.fov = this.perspectiveCamera.fov, t;
  }
  /**
   * Toggle between perspective and orthographic camera
   * 
   * @param controls Optional OrbitControls to update
   * @returns The new active camera
   */
  toggleCameraMode(t) {
    const e = this.activeCamera.position.clone(), i = (t == null ? void 0 : t.target.clone()) || this.initialTarget.clone(), o = e.distanceTo(i);
    if (this.isOrthographic = !this.isOrthographic, this.isOrthographic) {
      const n = this.perspectiveCamera.fov * (Math.PI / 180), s = 2 * Math.tan(n / 2) * o, c = s * this.currentAspect;
      this.orthographicCamera.left = -c / 2, this.orthographicCamera.right = c / 2, this.orthographicCamera.top = s / 2, this.orthographicCamera.bottom = -s / 2, this.orthographicCamera.position.copy(e), this.orthographicCamera.updateProjectionMatrix(), this.activeCamera = this.orthographicCamera;
    } else
      this.perspectiveCamera.position.copy(e), this.activeCamera = this.perspectiveCamera;
    return t && (t.object = this.activeCamera, t.target.copy(i), t.update()), this.activeCamera;
  }
  /**
   * Reset camera to initial position and target
   * 
   * @param controls Optional OrbitControls to update
   */
  resetCamera(t) {
    this.activeCamera.position.copy(this.initialPosition), t && (t.target.copy(this.initialTarget), t.update());
  }
  /**
   * Set initial camera position (for reset)
   * 
   * @param position New initial position
   */
  setInitialPosition(t) {
    this.initialPosition.copy(t);
  }
  /**
   * Set initial target position (for reset)
   * 
   * @param target New initial target
   */
  setInitialTarget(t) {
    this.initialTarget.copy(t);
  }
  /**
   * Update both cameras for the current position/target
   * Useful when programmatically moving the camera
   * 
   * @param position New camera position
   * @param target New target position
   * @param controls Optional controls to update
   */
  updateCameraPosition(t, e, i) {
    this.activeCamera.position.copy(t), this.isOrthographic ? this.perspectiveCamera.position.copy(t) : this.orthographicCamera.position.copy(t), i && e && (i.target.copy(e), i.update());
  }
  /**
   * Handle window resize - updates both cameras
   * 
   * @param width New width in pixels
   * @param height New height in pixels
   */
  handleResize(t, e) {
    const i = t / e;
    this.currentAspect = i, this.perspectiveCamera.aspect = i, this.perspectiveCamera.updateProjectionMatrix(), this.orthographicCamera.left = this.frustumSize * i / -2, this.orthographicCamera.right = this.frustumSize * i / 2, this.orthographicCamera.top = this.frustumSize / 2, this.orthographicCamera.bottom = this.frustumSize / -2, this.orthographicCamera.updateProjectionMatrix(), this.activeCamera instanceof r.PerspectiveCamera ? this.activeCamera.aspect = i : this.activeCamera instanceof r.OrthographicCamera && (this.activeCamera.left = this.frustumSize * i / -2, this.activeCamera.right = this.frustumSize * i / 2, this.activeCamera.top = this.frustumSize / 2, this.activeCamera.bottom = this.frustumSize / -2), this.activeCamera.updateProjectionMatrix();
  }
  /**
   * Save current camera state
   * 
   * @param controls Optional controls to save target from
   * @returns CameraState object
   */
  saveCameraState(t) {
    return {
      position: this.activeCamera.position.clone(),
      rotation: this.activeCamera.rotation.clone(),
      type: this.getCameraType(),
      distance: t ? this.activeCamera.position.distanceTo(t.target) : void 0,
      target: t == null ? void 0 : t.target.clone()
    };
  }
  /**
   * Restore camera state
   * 
   * @param state CameraState to restore
   * @param controls Optional controls to update
   */
  restoreCameraState(t, e) {
    t.type !== this.getCameraType() && this.toggleCameraMode(e), this.activeCamera.position.copy(t.position), this.activeCamera.rotation.copy(t.rotation), e && t.target && (e.target.copy(t.target), e.update());
  }
  /**
   * Get the initial position
   */
  getInitialPosition() {
    return this.initialPosition.clone();
  }
  /**
   * Get the initial target
   */
  getInitialTarget() {
    return this.initialTarget.clone();
  }
  /**
   * Calculate optimal camera distance for a given bounding box
   * 
   * @param boundingBox The bounding box to frame
   * @param padding Optional padding factor (default 1.2)
   * @returns Optimal camera distance
   */
  calculateOptimalDistance(t, e = 1.2) {
    const i = new r.Vector3();
    t.getSize(i);
    const o = Math.max(i.x, i.y, i.z);
    if (this.isOrthographic)
      return o * e;
    {
      const n = this.perspectiveCamera.fov * (Math.PI / 180);
      return o / 2 / Math.tan(n / 2) * e;
    }
  }
  /**
   * Frame a bounding box - positions camera to view entire box
   * 
   * @param boundingBox The bounding box to frame
   * @param controls Optional controls to update
   * @param padding Optional padding factor (default 1.2)
   */
  frameBoundingBox(t, e, i = 1.2) {
    const o = new r.Vector3();
    t.getCenter(o);
    const n = this.calculateOptimalDistance(t, i), s = new r.Vector3();
    this.activeCamera.getWorldDirection(s), s.multiplyScalar(-1);
    const c = o.clone().add(s.multiplyScalar(n));
    this.updateCameraPosition(c, o, e);
  }
  /**
   * Dispose of cameras (cleanup)
   */
  dispose() {
  }
}
function W(h) {
  return new v(h);
}
function D(h, t) {
  const e = h * (Math.PI / 180);
  return 2 * Math.tan(e / 2) * t;
}
class O {
  /**
   * Create a new lighting manager
   * @param scene The Three.js scene to add lights to
   * @param config Configuration options for lighting
   */
  constructor(t, e = {}) {
    a(this, "scene");
    a(this, "ambientLight");
    a(this, "headLight");
    a(this, "headLightOffset");
    a(this, "headLightEnabled", !0);
    a(this, "envLightingEnabled", !0);
    a(this, "envMap", null);
    a(this, "config");
    this.scene = t, this.config = {
      ambientIntensity: e.ambientIntensity ?? 0.1,
      headLightIntensity: e.headLightIntensity ?? 0.9,
      lightColor: e.lightColor ?? 16777215,
      initialOffset: e.initialOffset ?? new r.Vector2(0, 0)
    }, this.ambientLight = new r.AmbientLight(
      this.config.lightColor,
      this.config.ambientIntensity
    ), this.scene.add(this.ambientLight), this.headLight = new r.DirectionalLight(
      this.config.lightColor,
      this.config.headLightIntensity
    ), this.headLight.position.set(0, 0, 1), this.scene.add(this.headLight), this.headLightOffset = this.config.initialOffset.clone();
  }
  /**
   * Update head light position based on camera position and controls target.
   * This should be called in the animation loop for smooth tracking.
   * 
   * The head light maintains a fixed angular offset from the camera direction,
   * following the camera while respecting the configured offset angles.
   * 
   * @param camera The active camera
   * @param target The point the camera is looking at (typically controls.target)
   */
  updateHeadLight(t, e = new r.Vector3(0, 0, 0)) {
    this.headLight && (this.applyHeadLightOffset(t, e), this.headLight.lookAt(e));
  }
  /**
   * Apply the angular headLightOffset to compute headLight position relative to camera.
   * 
   * Algorithm:
   * 1. Get camera direction in spherical coordinates (theta, phi)
   * 2. Add offset angles
   * 3. Convert back to Cartesian coordinates
   * 4. Maintain same distance from target as camera
   * 
   * @param camera The active camera
   * @param target The point to position relative to
   */
  applyHeadLightOffset(t, e) {
    if (!this.headLight) return;
    const i = new r.Vector3().subVectors(t.position, e).normalize(), o = Math.atan2(i.x, i.z), n = Math.acos(Math.max(-1, Math.min(1, i.y))), s = o + this.headLightOffset.x, c = Math.max(0.01, Math.min(Math.PI - 0.01, n + this.headLightOffset.y)), d = t.position.distanceTo(e), g = e.x + d * Math.sin(c) * Math.sin(s), p = e.y + d * Math.cos(c), m = e.z + d * Math.sin(c) * Math.cos(s);
    this.headLight.position.set(g, p, m);
  }
  /**
   * Set the head light angular offset.
   * 
   * @param offset Angular offset [horizontal, vertical] in radians
   *   - x (horizontal): positive = rotate right
   *   - y (vertical): positive = rotate up
   */
  setHeadLightOffset(t) {
    this.headLightOffset.copy(t);
  }
  /**
   * Set the head light offset from degrees (convenience method).
   * Useful when loading from configuration files that store degrees.
   * 
   * @param horizontalDegrees Horizontal angle in degrees
   * @param verticalDegrees Vertical angle in degrees
   */
  setHeadLightOffsetFromDegrees(t, e) {
    const i = Math.PI / 180;
    this.headLightOffset.set(
      t * i,
      e * i
    );
  }
  /**
   * Get the current head light offset in radians
   */
  getHeadLightOffset() {
    return this.headLightOffset.clone();
  }
  /**
   * Toggle head light on/off
   * @returns New state (true = enabled, false = disabled)
   */
  toggleHeadLight() {
    return this.headLightEnabled = !this.headLightEnabled, this.headLight.intensity = this.headLightEnabled ? this.config.headLightIntensity : 0, this.headLightEnabled;
  }
  /**
   * Set head light enabled state
   * @param enabled Whether to enable the head light
   */
  setHeadLightEnabled(t) {
    this.headLightEnabled = t, this.headLight.intensity = t ? this.config.headLightIntensity : 0;
  }
  /**
   * Check if head light is enabled
   */
  isHeadLightEnabled() {
    return this.headLightEnabled;
  }
  /**
   * Set the head light intensity
   * @param intensity Light intensity (0 to 1+)
   */
  setHeadLightIntensity(t) {
    this.config.headLightIntensity = t, this.headLightEnabled && (this.headLight.intensity = t);
  }
  /**
   * Set the environment map for IBL (Image-Based Lighting)
   * @param envMap The environment texture or null to clear
   */
  setEnvironmentMap(t) {
    this.envMap = t, this.envLightingEnabled && (this.scene.environment = t);
  }
  /**
   * Toggle environment lighting on/off
   * @returns New state (true = enabled, false = disabled)
   */
  toggleEnvironmentLighting() {
    return this.envLightingEnabled = !this.envLightingEnabled, this.scene.environment = this.envLightingEnabled ? this.envMap : null, this.envLightingEnabled;
  }
  /**
   * Set environment lighting enabled state
   * @param enabled Whether to enable environment lighting
   */
  setEnvironmentLightingEnabled(t) {
    this.envLightingEnabled = t, this.scene.environment = t ? this.envMap : null;
  }
  /**
   * Check if environment lighting is enabled
   */
  isEnvironmentLightingEnabled() {
    return this.envLightingEnabled;
  }
  /**
   * Get the current lighting state
   */
  getState() {
    return {
      headLightEnabled: this.headLightEnabled,
      envLightingEnabled: this.envLightingEnabled,
      headLightIntensity: this.headLight.intensity,
      headLightOffset: this.headLightOffset.clone()
    };
  }
  /**
   * Get the ambient light object
   */
  getAmbientLight() {
    return this.ambientLight;
  }
  /**
   * Get the directional head light object
   */
  getHeadLight() {
    return this.headLight;
  }
  /**
   * Set ambient light intensity
   * @param intensity Light intensity (0 to 1+)
   */
  setAmbientIntensity(t) {
    this.config.ambientIntensity = t, this.ambientLight.intensity = t;
  }
  /**
   * Clean up resources
   */
  dispose() {
    this.ambientLight && (this.scene.remove(this.ambientLight), this.ambientLight.dispose()), this.headLight && (this.scene.remove(this.headLight), this.headLight.dispose());
  }
}
class w {
  /**
   * Create a new model loader
   * @param config Configuration options
   */
  constructor(t = {}) {
    a(this, "config");
    a(this, "plyLoader", null);
    a(this, "gltfLoader", null);
    a(this, "dracoLoader", null);
    var e, i, o, n;
    this.config = {
      dracoDecoderPath: t.dracoDecoderPath ?? "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
      dracoDecoderType: t.dracoDecoderType ?? "js",
      autoComputeNormals: t.autoComputeNormals ?? !0,
      defaultMaterial: {
        color: ((e = t.defaultMaterial) == null ? void 0 : e.color) ?? 14540253,
        flatShading: ((i = t.defaultMaterial) == null ? void 0 : i.flatShading) ?? !0,
        metalness: (o = t.defaultMaterial) == null ? void 0 : o.metalness,
        roughness: (n = t.defaultMaterial) == null ? void 0 : n.roughness
      }
    };
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
  async loadFromUrl(t, e, i) {
    var m;
    const o = this.detectFormat(t);
    if (o === "nxs" || o === "nxz")
      return {
        object: await this.parseNexus(t, e),
        format: o,
        byteSize: 0
        // NXS is streamed, size unknown
      };
    const n = await fetch(t, { credentials: "include" });
    if (!n.ok)
      throw new Error(`Failed to load model from ${t}: HTTP ${n.status}`);
    const s = parseInt(n.headers.get("content-length") || "0", 10), c = (m = n.body) == null ? void 0 : m.getReader();
    if (!c)
      throw new Error("Response body is not readable");
    const l = [];
    let d = 0;
    for (; ; ) {
      const { done: f, value: u } = await c.read();
      if (f) break;
      if (l.push(u), d += u.length, i && s > 0) {
        const C = d / s * 100;
        i(d, s, C);
      }
    }
    const g = new Uint8Array(d);
    let p = 0;
    for (const f of l)
      g.set(f, p), p += f.length;
    return this.loadFromBuffer(g.buffer, o, e, t);
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
  async loadFromBuffer(t, e, i, o) {
    let n;
    switch (e) {
      case "ply":
        n = await this.parsePLY(t, i);
        break;
      case "gltf":
      case "glb":
        n = await this.parseGLTF(t, i);
        break;
      case "nxs":
      case "nxz":
        if (!o)
          throw new Error("NXS/NXZ format requires URL for streaming");
        n = await this.parseNexus(o, i);
        break;
      default:
        throw new Error(`Unsupported format: ${e}`);
    }
    return {
      object: n,
      format: e,
      byteSize: t.byteLength
    };
  }
  /**
   * Detect file format from filename or URL
   * @param filename Filename or URL
   * @returns Detected format
   */
  detectFormat(t) {
    const e = t.toLowerCase();
    if (e.endsWith(".ply"))
      return "ply";
    if (e.endsWith(".glb"))
      return "glb";
    if (e.endsWith(".gltf"))
      return "gltf";
    if (e.endsWith(".nxs"))
      return "nxs";
    if (e.endsWith(".nxz"))
      return "nxz";
    throw new Error(`Cannot detect format from filename: ${t}`);
  }
  /**
   * Parse PLY format buffer
   * @param buffer ArrayBuffer containing PLY data
   * @param materialOverrides Optional material overrides
   * @returns Promise resolving to Three.js Mesh
   */
  async parsePLY(t, e) {
    if (!this.plyLoader) {
      const { PLYLoader: c } = await import("three/addons/loaders/PLYLoader.js");
      this.plyLoader = new c();
    }
    const i = this.plyLoader.parse(t);
    this.config.autoComputeNormals && i.computeVertexNormals();
    const o = this.mergeMaterialProperties(
      this.config.defaultMaterial,
      e
    ), n = new r.MeshStandardMaterial({
      color: o.color,
      flatShading: o.flatShading,
      metalness: o.metalness,
      roughness: o.roughness
    });
    return new r.Mesh(i, n);
  }
  /**
   * Parse GLTF/GLB format buffer
   * @param buffer ArrayBuffer containing GLTF/GLB data
   * @param materialOverrides Optional material overrides
   * @returns Promise resolving to Three.js Group
   */
  async parseGLTF(t, e) {
    if (!this.gltfLoader) {
      const [{ GLTFLoader: i }, { DRACOLoader: o }] = await Promise.all([
        import("three/addons/loaders/GLTFLoader.js"),
        import("three/addons/loaders/DRACOLoader.js")
      ]);
      this.gltfLoader = new i(), this.dracoLoader = new o(), this.dracoLoader.setDecoderPath(this.config.dracoDecoderPath), this.dracoLoader.setDecoderConfig({ type: this.config.dracoDecoderType }), this.gltfLoader.setDRACOLoader(this.dracoLoader);
    }
    return new Promise((i, o) => {
      this.gltfLoader.parse(
        t,
        "",
        // Resource path (not needed for buffer parsing)
        (n) => {
          const s = new r.Group();
          n.scene.traverse((c) => {
            if (c.isMesh) {
              const l = c.clone();
              e && l.material && this.applyMaterialOverrides(
                l.material,
                e
              ), s.add(l);
            }
          }), i(s);
        },
        (n) => {
          o(new Error(`Failed to parse GLTF: ${n.message || n}`));
        }
      );
    });
  }
  /**
   * Parse Nexus (NXS/NXZ) format from URL
   * Nexus is a multiresolution format that streams data incrementally
   * @param url URL to the .nxs or .nxz file
   * @param materialOverrides Optional material overrides (not typically used with Nexus)
   * @returns Promise resolving to NexusObject
   */
  async parseNexus(t, e) {
    const { NexusObject: i } = await import("./nexus3D.min-D0vdWDTF.js").then((n) => n.n), o = new i(
      t,
      () => console.log("✅ Nexus model loaded:", t),
      () => console.log("🔄 Nexus model updated (new data streamed)"),
      (n) => console.error("❌ Nexus error:", n)
    );
    return console.log("🔄 Nexus model created, streaming will begin automatically:", t), o;
  }
  /**
   * Apply material property overrides to an existing material
   * @param material Three.js material to modify
   * @param overrides Properties to override
   */
  applyMaterialOverrides(t, e) {
    const i = t;
    i.color && e.color !== void 0 && (i.color = new r.Color(e.color)), i.metalness !== void 0 && e.metalness !== void 0 && (i.metalness = e.metalness), i.roughness !== void 0 && e.roughness !== void 0 && (i.roughness = e.roughness), e.flatShading !== void 0 && (i.flatShading = e.flatShading, i.needsUpdate = !0);
  }
  /**
   * Merge material properties, with overrides taking precedence
   * @param defaults Default properties
   * @param overrides Override properties
   * @returns Merged properties
   */
  mergeMaterialProperties(t, e) {
    return {
      color: (e == null ? void 0 : e.color) ?? t.color ?? 14540253,
      flatShading: (e == null ? void 0 : e.flatShading) ?? t.flatShading ?? !0,
      metalness: (e == null ? void 0 : e.metalness) ?? t.metalness ?? 0.5,
      roughness: (e == null ? void 0 : e.roughness) ?? t.roughness ?? 0.5
    };
  }
  /**
   * Get the current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Update the Draco decoder path
   * @param path New path to Draco decoder
   */
  setDracoDecoderPath(t) {
    this.config.dracoDecoderPath = t, this.dracoLoader && this.dracoLoader.setDecoderPath(t);
  }
  /**
   * Clean up resources
   */
  dispose() {
    this.dracoLoader && (this.dracoLoader.dispose(), this.dracoLoader = null), this.plyLoader = null, this.gltfLoader = null;
  }
}
function X(h) {
  return new w(h);
}
class Y {
  constructor(t, e) {
    a(this, "renderer");
    a(this, "scene");
    a(this, "camera");
    a(this, "orthographicCamera", null);
    a(this, "perspectiveCamera");
    a(this, "isOrthographic", !1);
    a(this, "controls");
    a(this, "models", {});
    // Changed from meshes
    a(this, "currentScene", null);
    a(this, "mount");
    a(this, "ground", null);
    a(this, "homeButton");
    a(this, "lightButton");
    a(this, "lightPositionButton");
    a(this, "viewportGizmo", null);
    a(this, "envButton");
    a(this, "screenshotButton");
    a(this, "cameraButton");
    a(this, "annotationButton");
    a(this, "isPickingMode", !1);
    a(this, "onPointPicked", null);
    a(this, "initialCameraPosition", new r.Vector3(0, 0, 2));
    a(this, "initialControlsTarget", new r.Vector3(0, 0, 0));
    a(this, "lightEnabled", !0);
    a(this, "raycaster", new r.Raycaster());
    a(this, "mouse", new r.Vector2());
    a(this, "modelStats", {});
    a(this, "sceneBBoxSize", new r.Vector3(2, 2, 2));
    // Store actual scene size for ground
    // File URL resolver for loading models
    a(this, "fileUrlResolver");
    // Loading progress callbacks
    a(this, "onLoadProgress");
    a(this, "onLoadComplete");
    a(this, "onLoadError");
    // Managers
    a(this, "annotationManager");
    a(this, "cameraManager");
    a(this, "lightingManager");
    a(this, "modelLoader");
    if (typeof t == "string") {
      const d = document.getElementById(t);
      if (!d)
        throw new Error(`Element with ID "${t}" not found`);
      this.mount = d;
    } else
      this.mount = t;
    this.scene = new r.Scene(), this.scene.background = new r.Color(4210752);
    const i = this.mount.clientWidth, o = this.mount.clientHeight, n = i / o;
    this.fileUrlResolver = e || new P("./assets"), this.cameraManager = new v(n, {
      fov: 40,
      near: 0.1,
      far: 1e3,
      frustumSize: 2,
      initialPosition: new r.Vector3(0, 0, 2),
      initialTarget: new r.Vector3(0, 0, 0)
    }), this.perspectiveCamera = this.cameraManager.getPerspectiveCamera(), this.orthographicCamera = this.cameraManager.getOrthographicCamera(), this.camera = this.cameraManager.getActiveCamera(), this.renderer = new r.WebGLRenderer({ antialias: !0 }), this.renderer.setSize(i, o), this.renderer.toneMapping = r.ACESFilmicToneMapping, this.renderer.toneMappingExposure = 1, this.mount.appendChild(this.renderer.domElement), this.annotationManager = new E(this.scene, {
      color: 16776960,
      selectedColor: 16777062,
      markerSize: 10
    }), this.loadEnvironmentMap();
    const s = [
      {
        id: "home",
        icon: "bi-house",
        title: "Reset camera view",
        onClick: () => this.resetCamera(),
        visible: !1
      },
      {
        id: "light",
        icon: "bi-lightbulb-fill",
        title: "Toggle lighting",
        onClick: () => this.toggleLight(),
        visible: !1
      },
      {
        id: "lightPosition",
        icon: "bi-brightness-high",
        // Will be overridden by customHTML
        customHTML: `
          <div style="position: relative; width: 16px; height: 16px;">
            <i class="bi bi-brightness-high" style="position: absolute; top: -10px; left: -4px; font-size: 24px;"></i>
            <i class="bi bi-arrows-move" style="position: absolute; font-size: 32px; top: -16px; left: -8px;"></i>
          </div>
        `,
        title: "Position headlight",
        onClick: () => {
        },
        // TODO: Add light positioning functionality
        visible: !1
      },
      {
        id: "env",
        icon: "bi-globe",
        title: "Toggle environment lighting",
        onClick: () => this.toggleEnvLighting(),
        visible: !1
      },
      {
        id: "screenshot",
        icon: "bi-camera",
        title: "Take screenshot",
        onClick: () => this.takeScreenshot(),
        visible: !1
      },
      {
        id: "camera",
        icon: "bi-box",
        title: "Toggle orthographic/perspective",
        onClick: () => this.toggleCameraMode(),
        visible: !1
      },
      {
        id: "annotation",
        icon: "bi-pencil",
        title: "Add annotation",
        onClick: () => this.togglePickingMode(),
        visible: !1
      }
    ], l = new M().setContainer({
      position: "top-left",
      direction: "vertical",
      gap: "gap-2",
      zIndex: "1000"
    }).addButtons(s).build();
    this.homeButton = l.buttons.get("home"), this.lightButton = l.buttons.get("light"), this.lightPositionButton = l.buttons.get("lightPosition"), this.envButton = l.buttons.get("env"), this.screenshotButton = l.buttons.get("screenshot"), this.cameraButton = l.buttons.get("camera"), this.annotationButton = l.buttons.get("annotation"), this.mount.style.position = this.mount.style.position || "relative", this.mount.appendChild(l.container), this.lightingManager = new O(this.scene, {
      ambientIntensity: 0.1,
      headLightIntensity: 0.9,
      lightColor: 16777215,
      initialOffset: new r.Vector2(0, 0)
    }), this.modelLoader = new w({
      dracoDecoderPath: "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
      autoComputeNormals: !0,
      defaultMaterial: {
        color: 14540253,
        flatShading: !0
      }
    }), this.animate = this.animate.bind(this), this.animate(), this.handleResize = this.handleResize.bind(this), window.addEventListener("resize", this.handleResize), this.handleDoubleClick = this.handleDoubleClick.bind(this), this.renderer.domElement.addEventListener("dblclick", this.handleDoubleClick), this.handleClick = this.handleClick.bind(this), this.renderer.domElement.addEventListener("click", this.handleClick);
  }
  dispose() {
    window.removeEventListener("resize", this.handleResize), this.renderer.domElement.removeEventListener("dblclick", this.handleDoubleClick), this.renderer.domElement.removeEventListener("click", this.handleClick), this.annotationManager.dispose(), this.lightingManager.dispose(), this.modelLoader.dispose(), this.renderer.dispose(), this.renderer.domElement.parentNode && this.renderer.domElement.parentNode.removeChild(this.renderer.domElement), this.homeButton.parentNode && this.homeButton.parentNode.removeChild(this.homeButton), this.lightButton.parentNode && this.lightButton.parentNode.removeChild(this.lightButton), this.lightPositionButton.parentNode && this.lightPositionButton.parentNode.removeChild(this.lightPositionButton), this.envButton.parentNode && this.envButton.parentNode.removeChild(this.envButton), this.screenshotButton.parentNode && this.screenshotButton.parentNode.removeChild(this.screenshotButton), this.annotationButton.parentNode && this.annotationButton.parentNode.removeChild(this.annotationButton), this.viewportGizmo && this.viewportGizmo.dispose && (this.viewportGizmo.dispose(), this.viewportGizmo = null);
  }
  handleResize() {
    const t = this.mount.clientWidth, e = this.mount.clientHeight;
    this.renderer.setSize(t, e), this.cameraManager.handleResize(t, e), this.camera = this.cameraManager.getActiveCamera(), this.controls && this.controls.update(), this.viewportGizmo && this.viewportGizmo.update();
  }
  /**
   * Handle double-click on the canvas to recenter the camera on the clicked point
   */
  handleDoubleClick(t) {
    if (!this.controls) return;
    const e = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = (t.clientX - e.left) / e.width * 2 - 1, this.mouse.y = -((t.clientY - e.top) / e.height) * 2 + 1, this.raycaster.setFromCamera(this.mouse, this.camera);
    const i = [];
    Object.values(this.models).forEach((n) => {
      n.traverse((s) => {
        s instanceof r.Mesh && i.push(s);
      });
    });
    const o = this.raycaster.intersectObjects(i, !1);
    if (o.length > 0) {
      const n = o[0].point;
      if (this.isPickingMode) {
        const s = [
          n.x,
          n.y,
          n.z
        ];
        console.log("📍 Picked 3D point:", s.map((c) => c.toFixed(4))), this.onPointPicked && this.onPointPicked(s), this.exitPickingMode();
        return;
      }
      console.log("🎯 Recentering camera on point:", n), this.animateCameraTarget(n);
    }
  }
  /**
   * Handle single click for annotation selection
   */
  handleClick(t) {
    if (this.annotationManager.isPickingMode()) return;
    const e = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = (t.clientX - e.left) / e.width * 2 - 1, this.mouse.y = -((t.clientY - e.top) / e.height) * 2 + 1, this.raycaster.setFromCamera(this.mouse, this.camera);
    const i = this.annotationManager.getAllMarkers(), o = this.raycaster.intersectObjects(i, !1);
    if (o.length > 0) {
      const n = o[0].object, s = this.annotationManager.getAnnotationIdFromMarker(n);
      s && (t.ctrlKey || t.metaKey ? this.annotationManager.toggleSelection(s) : this.annotationManager.select([s], !1));
    } else
      !t.ctrlKey && !t.metaKey && this.annotationManager.clearSelection();
  }
  /**
   * Toggle picking mode for annotation placement
   */
  togglePickingMode() {
    this.isPickingMode ? this.exitPickingMode() : this.enterPickingMode();
  }
  /**
   * Enter picking mode
   */
  enterPickingMode() {
    this.isPickingMode = !0, this.renderer.domElement.style.cursor = "crosshair", this.annotationButton.style.backgroundColor = "#0d6efd", this.annotationButton.style.color = "white", console.log("✏️ Entered picking mode - double-click on model to pick a point");
  }
  /**
   * Exit picking mode
   */
  exitPickingMode() {
    this.isPickingMode = !1, this.renderer.domElement.style.cursor = "auto", this.annotationButton.style.backgroundColor = "", this.annotationButton.style.color = "", console.log("✅ Exited picking mode");
  }
  /**
   * Smoothly animate the camera controls target to a new position
   */
  animateCameraTarget(t) {
    if (!this.controls) return;
    const e = this.controls.target.clone(), i = t.clone(), o = 500, n = performance.now(), s = () => {
      const c = performance.now() - n, l = Math.min(c / o, 1), d = 1 - Math.pow(1 - l, 3);
      this.controls.target.lerpVectors(e, i, d), this.controls.update(), l < 1 && requestAnimationFrame(s);
    };
    s();
  }
  animate() {
    requestAnimationFrame(this.animate), this.controls && this.controls.update();
    const t = this.controls && this.controls.target ? this.controls.target : new r.Vector3(0, 0, 0);
    this.lightingManager.updateHeadLight(this.camera, t), this.annotationManager.updateMarkerScales(this.camera, this.renderer.domElement.clientHeight), this.scene.traverse((e) => {
      e.update && typeof e.update == "function" && e.update(this.camera);
    }), this.renderer.render(this.scene, this.camera), this.viewportGizmo && typeof this.viewportGizmo.render == "function" && this.viewportGizmo.render();
  }
  /**
   * Load a new scene description
   * @param sceneDesc Scene description
   * @param preserveCamera If true, keeps current camera position instead of reframing
   */
  async loadScene(t, e = !1) {
    var i;
    try {
      let o = null, n = null;
      if (e && this.controls && (o = this.camera.position.clone(), n = this.controls.target.clone(), console.log("📷 Preserving camera position during scene reload")), this.currentScene = t, this.clearScene(), t.environment && this.applyEnvironmentSettings(t.environment), t.enableControls !== !1 && await this.setupControls(), t.models && t.models.length > 0) {
        if (await this.loadAllModels(t.models), !e)
          this.frameScene();
        else {
          const s = new r.Box3();
          Object.values(this.models).forEach((l) => s.expandByObject(l));
          const c = s.getSize(new r.Vector3());
          this.sceneBBoxSize.copy(c);
        }
        (i = t.environment) != null && i.showGround && (this.removeGround(), this.addGround());
      }
      e && o && n && this.controls && (this.camera.position.copy(o), this.controls.target.copy(n), this.controls.update(), console.log("📷 Camera position restored after scene reload")), t.annotations && t.annotations.length > 0 && this.annotationManager.render(t.annotations), console.log("✅ Scene loaded successfully");
    } catch (o) {
      throw console.error("❌ Failed to load scene:", o), o;
    }
  }
  /**
   * Clear all models from the scene
   */
  clearScene() {
    Object.values(this.models).forEach((t) => {
      this.scene.remove(t);
    }), this.models = {};
  }
  /**
   * Apply transforms from ModelDefinition to a loaded Object3D
   * - position: [x,y,z]
   * - rotation: [x,y,z] in radians or degrees (auto-detect)
   * - scale: single number or [x,y,z]
   */
  applyTransforms(t, e) {
    var i;
    if (e.position && e.position.length === 3 && t.position.set(e.position[0], e.position[1], e.position[2]), e.rotation && e.rotation.length === 3) {
      const o = e.rotation, n = (i = this.currentScene) == null ? void 0 : i.rotationUnits, s = e.rotationUnits || n || null;
      let c = o[0], l = o[1], d = o[2];
      if (s === "deg") {
        const g = Math.PI / 180;
        c = o[0] * g, l = o[1] * g, d = o[2] * g;
      } else if (s !== "rad") {
        const g = Math.max(Math.abs(o[0]), Math.abs(o[1]), Math.abs(o[2])), p = Math.PI * 2;
        if (g > p + 1e-4) {
          const m = Math.PI / 180;
          c = o[0] * m, l = o[1] * m, d = o[2] * m;
        }
      }
      t.rotation.set(c, l, d);
    }
    e.scale !== void 0 && (typeof e.scale == "number" ? t.scale.set(e.scale, e.scale, e.scale) : Array.isArray(e.scale) && e.scale.length === 3 && t.scale.set(e.scale[0], e.scale[1], e.scale[2]));
  }
  /**
   * Apply environment settings (ground, background)
   */
  applyEnvironmentSettings(t) {
    var e;
    if (this.removeGround(), t.showGround && this.addGround(), t.background && (this.scene.background = new r.Color(t.background)), t.headLightOffset && Array.isArray(t.headLightOffset) && t.headLightOffset.length >= 2) {
      this.lightingManager.setHeadLightOffsetFromDegrees(
        t.headLightOffset[0] || 0,
        t.headLightOffset[1] || 0
      );
      const i = ((e = this.controls) == null ? void 0 : e.target) || new r.Vector3(0, 0, 0);
      this.lightingManager.updateHeadLight(this.camera, i);
    }
  }
  /**
   * Setup orbit controls and viewport gizmo
   */
  async setupControls() {
    if (this.controls) return;
    const { OrbitControls: t } = await import("three/addons/controls/OrbitControls.js");
    if (this.controls = new t(this.camera, this.renderer.domElement), this.controls.enableDamping = !0, this.controls.dampingFactor = 0.05, this.controls.screenSpacePanning = !0, this.controls.minDistance = 0.1, this.controls.maxDistance = 1e3, this.controls.target.set(0, 0, 0), this.controls.update(), !this.viewportGizmo)
      try {
        const { ViewportGizmo: e } = await import("./three-viewport-gizmo-BzVRDde7.js");
        this.viewportGizmo = new e(this.camera, this.renderer, {
          container: this.mount,
          size: 80
        }), this.viewportGizmo.attachControls && this.viewportGizmo.attachControls(this.controls), console.log("✅ ViewportGizmo created and attached to controls");
      } catch (e) {
        console.warn("⚠️ Failed to load viewport gizmo dynamically:", e);
      }
  }
  /**
   * Load all models from the scene description
   */
  async loadAllModels(t) {
    const e = t.map((i) => this.loadModel(i));
    await Promise.all(e);
  }
  /**
   * Load a single model
   */
  async loadModel(t) {
    var o, n, s, c, l, d;
    const e = (o = this.currentScene) == null ? void 0 : o.projectId, i = this.fileUrlResolver.resolve(t.file, { projectId: e });
    console.log(`Loading model ${t.id} from ${i}`);
    try {
      (n = this.onLoadProgress) == null || n.call(this, {
        modelId: t.id,
        fileName: t.file,
        loaded: 0,
        total: 0,
        percentage: 0,
        status: "loading"
      });
      const g = await this.loadModelFile(i, t);
      this.applyTransforms(g, t), t.visible !== void 0 && (g.visible = t.visible), this.modelStats[t.id] = z(g), console.log(`📊 Model ${t.id} stats:`, this.modelStats[t.id]), this.models[t.id] = g, this.scene.add(g), console.log(`✅ Loaded model ${t.id}`), (s = this.onLoadProgress) == null || s.call(this, {
        modelId: t.id,
        fileName: t.file,
        loaded: 0,
        total: 0,
        percentage: 100,
        status: "complete"
      }), (c = this.onLoadComplete) == null || c.call(this, t.id);
    } catch (g) {
      throw console.error(`❌ Failed to load model ${t.id}:`, g), (l = this.onLoadProgress) == null || l.call(this, {
        modelId: t.id,
        fileName: t.file,
        loaded: 0,
        total: 0,
        percentage: 0,
        status: "error"
      }), (d = this.onLoadError) == null || d.call(this, t.id, g), g;
    }
  }
  /**
   * Load a model file based on its extension
   */
  async loadModelFile(t, e) {
    const i = e.material ? {
      color: e.material.color ? parseInt(e.material.color.replace("#", ""), 16) : void 0,
      flatShading: e.material.flatShading,
      metalness: e.material.metalness,
      roughness: e.material.roughness
    } : void 0, o = (s, c, l) => {
      var d;
      (d = this.onLoadProgress) == null || d.call(this, {
        modelId: e.id,
        fileName: e.file,
        loaded: s,
        total: c,
        percentage: l,
        status: "loading"
      });
    }, n = await this.modelLoader.loadFromUrl(t, i, o);
    return console.log(`📦 Loaded ${n.format.toUpperCase()} model (${(n.byteSize / 1024).toFixed(2)} KB)`), n.object;
  }
  /**
   * Frame the scene - position models and camera without scaling
   * Models without predefined positions are translated so:
   * - Bottom of bbox is at y=0
   * - Center of X and Z axes are at origin
   * Camera is positioned at appropriate distance based on scene size
   */
  frameScene() {
    const t = Object.values(this.models);
    if (t.length === 0) return;
    const e = new r.Box3();
    t.forEach((n) => e.expandByObject(n));
    const i = e.getSize(new r.Vector3()), o = Math.max(i.x, i.y, i.z);
    if (console.log("Scene bounding box size (original):", i, "maxDim:", o), this.sceneBBoxSize.copy(i), o > 0) {
      const n = e.getCenter(new r.Vector3()), s = -n.x, c = -n.z, l = -e.min.y;
      t.forEach((f, u) => {
        var C;
        if ((C = this.currentScene) != null && C.models) {
          const b = this.currentScene.models[u];
          if (b)
            if (!b.position || b.position.length !== 3) {
              const L = new r.Vector3(s, l, c);
              f.position.add(L);
              const y = f.position;
              b.position = [
                parseFloat(y.x.toFixed(3)),
                parseFloat(y.y.toFixed(3)),
                parseFloat(y.z.toFixed(3))
              ], console.log(`📍 Model ${b.id} auto-positioned to:`, b.position);
            } else
              console.log(`📍 Model ${b.id} using predefined position:`, b.position);
        }
      });
      const d = this.perspectiveCamera.fov * (Math.PI / 180), g = o / 2 / Math.tan(d / 2), p = i.y * 0.5, m = g * 1.2;
      if (this.camera.position.set(0, p, m), this.controls && (this.controls.target.set(0, p, 0), this.controls.minDistance = o * 0.1, this.controls.maxDistance = o * 10, this.controls.update()), this.orthographicCamera) {
        const f = this.mount.clientWidth / this.mount.clientHeight, u = o, C = u * f;
        this.orthographicCamera.left = -C / 2, this.orthographicCamera.right = C / 2, this.orthographicCamera.top = u / 2, this.orthographicCamera.bottom = -u / 2, this.orthographicCamera.position.set(0, p, m), this.orthographicCamera.updateProjectionMatrix();
      }
      this.initialCameraPosition.copy(this.camera.position), this.initialControlsTarget.set(0, p, 0), this.cameraManager.setInitialPosition(this.camera.position), this.cameraManager.setInitialTarget(new r.Vector3(0, p, 0)), console.log(`📷 Camera positioned at distance ${m.toFixed(2)}, target height ${p.toFixed(2)}`);
    }
  }
  /**
   * Get current presenter state (for saving/persistence)
   */
  getState() {
    var t;
    return {
      camera: {
        position: this.camera.position.toArray(),
        target: ((t = this.controls) == null ? void 0 : t.target.toArray()) || [0, 0, 0],
        fov: this.camera instanceof r.PerspectiveCamera ? this.camera.fov : 45
      },
      rendering: {
        headLightEnabled: this.lightEnabled,
        envLightingEnabled: this.lightingManager.isEnvironmentLightingEnabled()
      },
      modelVisibility: this.getModelVisibility()
    };
  }
  /**
   * Apply transformations to a specific model without saving to scene
   * Useful for live preview while editing
   */
  applyModelTransform(t, e, i, o) {
    const n = this.models[t];
    if (!n) {
      console.warn(`Model ${t} not found`);
      return;
    }
    e && e.length === 3 && n.position.set(e[0], e[1], e[2]), i && i.length === 3 && n.rotation.set(i[0], i[1], i[2]), o != null && (typeof o == "number" ? n.scale.set(o, o, o) : Array.isArray(o) && o.length === 3 && n.scale.set(o[0], o[1], o[2]));
  }
  /**
   * Restore presenter state (from saved/persistence)
   */
  setState(t) {
    this.camera.position.fromArray(t.camera.position), this.controls && (this.controls.target.fromArray(t.camera.target), this.controls.update()), t.camera.fov && this.camera instanceof r.PerspectiveCamera && (this.camera.fov = t.camera.fov, this.camera.updateProjectionMatrix()), this.lightEnabled = t.rendering.headLightEnabled, this.lightingManager.setHeadLightEnabled(this.lightEnabled), this.lightButton.innerHTML = this.lightEnabled ? '<i class="bi bi-lightbulb-fill"></i>' : '<i class="bi bi-lightbulb"></i>', this.lightingManager.setEnvironmentLightingEnabled(t.rendering.envLightingEnabled), this.envButton.innerHTML = t.rendering.envLightingEnabled ? '<i class="bi bi-globe"></i>' : '<i class="bi bi-circle"></i>';
    for (const [e, i] of Object.entries(t.modelVisibility))
      this.setModelVisibility(e, i);
  }
  /**
   * Set visibility of a model by ID
   */
  setModelVisibility(t, e) {
    const i = this.models[t];
    i ? (i.visible = e, console.log(`👁️ Model '${t}' visibility set to ${e}`)) : console.warn(`⚠️ Model '${t}' not found in loaded models. Available models:`, Object.keys(this.models));
  }
  /**
   * Get visibility of a specific model
   */
  getModelVisibilityById(t) {
    const e = this.models[t];
    return e ? e.visible : !1;
  }
  /**
   * Get visibility of all models
   */
  getModelVisibility() {
    const t = {};
    for (const [e, i] of Object.entries(this.models))
      t[e] = i.visible;
    return t;
  }
  /**
   * Get the annotation manager instance for direct access to annotation API
   * @returns The AnnotationManager instance
   */
  getAnnotationManager() {
    return this.annotationManager;
  }
  /**
   * Set background color without reloading the scene
   * @param color Hex color string (e.g., '#404040')
   */
  setBackgroundColor(t) {
    this.scene.background = new r.Color(t), this.currentScene && this.currentScene.environment && (this.currentScene.environment.background = t), console.log("🎨 Background color updated to:", t);
  }
  /**
   * Toggle ground visibility without reloading the scene
   * @param visible Whether the ground should be visible
   */
  setGroundVisible(t) {
    t && !this.ground ? this.addGround() : !t && this.ground && this.removeGround(), this.currentScene && this.currentScene.environment && (this.currentScene.environment.showGround = t), console.log("🌍 Ground visibility set to:", t);
  }
  /**
   * Set head light offset without reloading the scene
   * @param thetaDeg Horizontal angle in degrees
   * @param phiDeg Vertical angle in degrees
   */
  setHeadLightOffset(t, e) {
    var o;
    this.lightingManager.setHeadLightOffsetFromDegrees(t, e);
    const i = ((o = this.controls) == null ? void 0 : o.target) || new r.Vector3(0, 0, 0);
    this.lightingManager.updateHeadLight(this.camera, i), this.currentScene && this.currentScene.environment && (this.currentScene.environment.headLightOffset || (this.currentScene.environment.headLightOffset = [0, 0]), this.currentScene.environment.headLightOffset[0] = t, this.currentScene.environment.headLightOffset[1] = e), console.log("💡 Head light offset updated to:", t, e);
  }
  resetCamera() {
    this.cameraManager.resetCamera(this.controls), console.log("📷 Camera view reset to home position");
  }
  toggleLight() {
    this.lightEnabled = this.lightingManager.toggleHeadLight(), this.lightButton.innerHTML = this.lightEnabled ? '<i class="bi bi-lightbulb-fill"></i>' : '<i class="bi bi-lightbulb"></i>', console.log(`💡 Lighting ${this.lightEnabled ? "enabled" : "disabled"}`);
  }
  toggleEnvLighting() {
    const t = this.lightingManager.toggleEnvironmentLighting();
    this.envButton.innerHTML = t ? '<i class="bi bi-globe"></i>' : '<i class="bi bi-circle"></i>', console.log(`🌍 Environment lighting ${t ? "enabled" : "disabled"}`);
  }
  /**
   * Show or hide the annotation button
   */
  setAnnotationButtonVisible(t) {
    this.annotationButton.style.display = t ? "flex" : "none", !t && this.isPickingMode && this.exitPickingMode();
  }
  /**
   * Show or hide a specific UI button
   * @param buttonName - Name of the button: 'home', 'light', 'lightPosition', 'env', 'screenshot', 'camera', 'annotation'
   * @param visible - true to show, false to hide
   */
  setButtonVisible(t, e) {
    const i = {
      home: this.homeButton,
      light: this.lightButton,
      lightPosition: this.lightPositionButton,
      env: this.envButton,
      screenshot: this.screenshotButton,
      camera: this.cameraButton,
      annotation: this.annotationButton
    }, o = i[t];
    o ? (o.style.display = e ? "flex" : "none", t === "annotation" && !e && this.isPickingMode && this.exitPickingMode()) : console.warn(`Unknown button name: ${t}. Valid options: ${Object.keys(i).join(", ")}`);
  }
  /**
   * Show or hide all UI buttons at once
   */
  setAllButtonsVisible(t) {
    this.homeButton.style.display = t ? "flex" : "none", this.lightButton.style.display = t ? "flex" : "none", this.lightPositionButton.style.display = t ? "flex" : "none", this.envButton.style.display = t ? "flex" : "none", this.screenshotButton.style.display = t ? "flex" : "none", this.cameraButton.style.display = t ? "flex" : "none", this.annotationButton.style.display = t ? "flex" : "none", !t && this.isPickingMode && this.exitPickingMode();
  }
  toggleCameraMode() {
    this.orthographicCamera && (this.camera = this.cameraManager.toggleCameraMode(this.controls), this.isOrthographic = this.cameraManager.isOrthographicMode(), this.isOrthographic ? (this.cameraButton.style.opacity = "0.7", console.log("📦 Switched to orthographic camera")) : (this.cameraButton.style.opacity = "1", console.log("📐 Switched to perspective camera")), this.recreateViewportGizmo());
  }
  async recreateViewportGizmo() {
    if (this.viewportGizmo && this.viewportGizmo.dispose) {
      try {
        this.viewportGizmo.dispose(), console.log("🗑️ Disposed old viewport gizmo");
      } catch (t) {
        console.warn("Failed to dispose viewport gizmo:", t);
      }
      this.viewportGizmo = null;
    }
    try {
      const { ViewportGizmo: t } = await import("./three-viewport-gizmo-BzVRDde7.js");
      this.viewportGizmo = new t(this.camera, this.renderer, {
        container: this.mount,
        size: 80
      }), this.viewportGizmo.attachControls && this.controls && this.viewportGizmo.attachControls(this.controls), console.log("✅ Recreated viewport gizmo with new camera");
    } catch (t) {
      console.warn("⚠️ Failed to recreate viewport gizmo:", t);
    }
  }
  takeScreenshot() {
    this.renderer.render(this.scene, this.camera);
    const t = this.renderer.domElement.toDataURL("image/png"), e = document.createElement("a"), i = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, -5);
    e.download = `screenshot-${i}.png`, e.href = t, e.click(), console.log("📸 Screenshot captured and downloaded");
  }
  /**
   * Calculate triangle and vertex counts for a loaded model
   * @param modelId - The ID of the model to analyze
   * @returns Object with triangle and vertex counts, or null if model not found
   */
  getModelStats(t) {
    return this.modelStats[t] || null;
  }
  addGround() {
    const e = Math.max(this.sceneBBoxSize.x, this.sceneBBoxSize.z) * 2, i = Math.max(10, Math.min(50, Math.floor(e / 0.1))), o = 14540253, n = 8947848;
    this.ground = new r.GridHelper(e, i, o, n), this.scene.add(this.ground), console.log(`🌍 Ground grid created: size=${e.toFixed(2)}, divisions=${i}`);
  }
  removeGround() {
    this.ground && (this.scene.remove(this.ground), this.ground = null);
  }
  async loadEnvironmentMap() {
    try {
      const { EXRLoader: t } = await import("three/addons/loaders/EXRLoader.js");
      new t().load(
        "/brown_photostudio_02_1k.exr",
        (i) => {
          i.mapping = r.EquirectangularReflectionMapping, this.lightingManager.setEnvironmentMap(i), console.log("✅ Environment map loaded successfully");
        },
        void 0,
        (i) => {
          console.error("❌ Failed to load environment map:", i);
        }
      );
    } catch (t) {
      console.warn("EXRLoader dynamic import failed or not available:", t);
    }
  }
  /**
   * Selection management methods for annotations
   */
  /**
   * Selection management methods (delegate to AnnotationManager)
   */
}
export {
  E as AnnotationManager,
  v as CameraManager,
  I as DefaultFileUrlResolver,
  T as FunctionResolver,
  O as LightingManager,
  w as ModelLoader,
  P as StaticBaseUrlResolver,
  Y as ThreePresenter,
  M as UIControlsBuilder,
  V as calculateCameraDistance,
  G as calculateCenteringOffset,
  D as calculateFrustumSize,
  z as calculateObjectStats,
  B as calculateSceneBoundingBox,
  $ as calculateSceneCenteringOffset,
  N as createButton,
  U as createButtonPanel,
  W as createCameraManager,
  X as createModelLoader,
  j as formatStats,
  F as getMaxDimension,
  H as hasValidPosition,
  R as roundPosition
};
//# sourceMappingURL=three-presenter.js.map
