import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import * as THREE from 'three';

const canvasContext = {
  clearRect() {},
  beginPath() {},
  arc() {},
  fill() {},
  stroke() {},
};

let AnnotationManager;
let createProjectedAreaGeometry;
let createProjectedClipVolumeGeometry;

before(async () => {
  globalThis.document = {
    createElement: (tagName) => {
      assert.equal(tagName, 'canvas');
      return {
        width: 0,
        height: 0,
        getContext: () => canvasContext,
      };
    },
  };
  ({
    AnnotationManager,
    createProjectedAreaGeometry,
    createProjectedClipVolumeGeometry,
  } = await import('../dist/three-presenter.js'));
});

test('area prototype triangulates concave boundaries in projected view space', () => {
  const vertices = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(2, 0, 0),
    new THREE.Vector3(2, 1, 0),
    new THREE.Vector3(1, 0.4, 0),
    new THREE.Vector3(0, 1, 0),
  ];
  const geometry = createProjectedAreaGeometry(vertices, (vertex) => vertex);
  assert.ok(geometry);
  assert.equal(geometry.getAttribute('position').count, vertices.length);
  assert.equal(geometry.getIndex().count, 9);
  geometry.dispose();
});

test('area clipping prototype extrudes the projected boundary through the camera range', () => {
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 5;
  camera.updateMatrixWorld();
  const vertices = [
    new THREE.Vector3(-1, -1, 0),
    new THREE.Vector3(1, -1, 0),
    new THREE.Vector3(1, 1, 0),
    new THREE.Vector3(-1, 1, 0),
  ];
  const geometry = createProjectedClipVolumeGeometry(vertices, camera);
  assert.ok(geometry);
  assert.equal(geometry.getAttribute('position').count, 8);
  assert.equal(geometry.getIndex().count, 36);
  geometry.dispose();
});

test('area clipping prototype accepts model-derived NDC depth bounds', () => {
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 5;
  camera.updateMatrixWorld();
  const vertices = [
    new THREE.Vector3(-1, -1, 0),
    new THREE.Vector3(1, -1, 0),
    new THREE.Vector3(1, 1, 0),
    new THREE.Vector3(-1, 1, 0),
  ];
  const geometry = createProjectedClipVolumeGeometry(vertices, camera, {
    nearNdc: 0.2,
    farNdc: 0.4,
  });
  assert.ok(geometry);
  const positions = geometry.getAttribute('position');
  assert.ok(Math.abs(new THREE.Vector3().fromBufferAttribute(positions, 0).project(camera).z - 0.2) < 1e-5);
  assert.ok(Math.abs(new THREE.Vector3().fromBufferAttribute(positions, 4).project(camera).z - 0.4) < 1e-5);
  geometry.dispose();
});

test('area prototype fill is added and updated separately from its outline', () => {
  const manager = new AnnotationManager(new THREE.Scene());
  manager.setAreaFillProjector((vertices) => createProjectedAreaGeometry(vertices, (vertex) => vertex));
  manager.setAreaClipVolumeProjector((vertices) => createProjectedClipVolumeGeometry(vertices, new THREE.PerspectiveCamera()));
  manager.render([{
    id: 'area-1', label: 'Test area', type: 'area',
    geometry: [[0, 0, 0], [2, 0, 0], [0, 2, 0]],
  }]);
  const marker = manager.getMarker('area-1');
  const fill = marker.children.find((child) => child.userData.annotationRole === 'area-fill');
  assert.ok(fill);
  assert.equal(fill.visible, true);
  assert.equal(fill.geometry.getIndex().count, 3);
  manager.select(['area-1']);
  assert.equal(fill.material.opacity, manager.getConfig().selectedAreaFillOpacity);
  assert.equal(manager.getAreaClipVolumes().length, 1);
  const volume = manager.getAreaClipVolumes()[0];
  assert.equal(volume.material.stencilWrite, true);
  assert.equal(volume.material.stencilRef, 1);
  manager.dispose();
});

test('mesh-sampled area fill remains visible alongside the clip overlay', () => {
  const manager = new AnnotationManager(new THREE.Scene());
  manager.setAreaSurfaceProjector(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0, 1, 0, 0, 0, 1, 0,
    ], 3));
    geometry.setIndex([0, 1, 2]);
    return geometry;
  });
  manager.setAreaClipVolumeEnabled(true);
  manager.render([{
    id: 'area-surface', label: 'Surface area', type: 'area',
    geometry: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  }]);
  const marker = manager.getMarker('area-surface');
  const fill = marker.children.find((child) => child.userData.annotationRole === 'area-fill');
  assert.ok(fill);
  assert.equal(fill.visible, true);
  manager.dispose();
});

function createSelectedLineManager(type = 'line') {
  const manager = new AnnotationManager(new THREE.Scene());
  manager.render([{
    id: 'line-1',
    label: 'Test line',
    type,
    geometry: type === 'area'
      ? [[0, 0, 0], [2, 0, 0], [0, 2, 0]]
      : [[0, 0, 0], [1, 0, 0], [2, 0, 0]],
  }]);
  manager.select(['line-1']);
  return manager;
}

function findLineHandle(manager, vertexIndex) {
  const marker = manager.getMarker('line-1');
  let result;
  marker.traverse((child) => {
    if (
      child.userData.annotationRole === 'line-vertex-handle' &&
      child.userData.annotationVertexIndex === vertexIndex
    ) {
      result = child;
    }
  });
  assert.ok(result, `Expected line handle ${vertexIndex}`);
  return result;
}

function findHandleGroup(manager) {
  const marker = manager.getMarker('line-1');
  let result;
  marker.traverse((child) => {
    if (child.userData.annotationRole === 'line-handles') {
      result = child;
    }
  });
  assert.ok(result, 'Expected line handle group');
  return result;
}

function findLineRole(manager, role) {
  const marker = manager.getMarker('line-1');
  let result;
  marker.traverse((child) => {
    if (child.userData.annotationRole === role) {
      result = child;
    }
  });
  assert.ok(result, `Expected line role ${role}`);
  return result;
}

test('editing mode gates line handles and drag entry', () => {
  const manager = createSelectedLineManager();
  const handle = findLineHandle(manager, 1);
  const handleGroup = findHandleGroup(manager);

  assert.equal(manager.canEditAnnotationFromMarker(handle, 1), true);
  assert.equal(handleGroup.visible, true);

  manager.setEditingEnabled(false);
  assert.equal(manager.canEditAnnotationFromMarker(handle, 1), false);
  assert.equal(handleGroup.visible, false);

  manager.setEditingEnabled(true);
  assert.equal(manager.canEditAnnotationFromMarker(handle, 1), true);
  assert.equal(handleGroup.visible, true);
  manager.dispose();
});

test('area drafts preview closure, validate controls, and never duplicate the first point', () => {
  const scene = new THREE.Scene();
  const manager = new AnnotationManager(scene);
  manager.addLineDraftVertex([0, 0, 0], true);
  manager.addLineDraftVertex([2, 0, 0], true);
  manager.updateLineDraftPreview([0, 2, 0]);
  const preview = scene.children[0].children.find((child) => child.userData.annotationRole === 'line-preview');
  assert.equal(preview.geometry.getAttribute('instanceStart').count, 2);
  assert.equal(manager.finalizeLineDraft(), null);
  assert.equal(scene.children.length, 0);

  for (const point of [[0, 0, 0], [1, 0, 0], [2, 0, 0]]) manager.addLineDraftVertex(point, true);
  assert.equal(manager.finalizeLineDraft(), null, 'collinear areas are invalid');

  const controls = [[0, 0, 0], [2, 0, 0], [0, 2, 0]];
  for (const point of [...controls, controls[0]]) manager.addLineDraftVertex(point, true);
  assert.deepEqual(manager.finalizeLineDraft().geometry, controls);
  manager.addLineDraftVertex([0, 0, 0], true);
  manager.cancelLineDraft();
  assert.equal(manager.hasLineDraft(), false);
  assert.equal(scene.children.length, 0);
  manager.dispose();
});

test('area editing supports the closing segment and protects valid geometry', () => {
  const manager = createSelectedLineManager('area');
  const updates = [];
  manager.onAnnotationUpdated((annotation) => updates.push(annotation));
  const hit = findLineRole(manager, 'line-hit');
  assert.equal(hit.geometry.getAttribute('instanceStart').count, 3);
  assert.equal(manager.insertLineVertexFromMarker(hit, 2, [0, 1, 0]), true);
  assert.deepEqual(updates.at(-1).geometry, [[0, 0, 0], [2, 0, 0], [0, 2, 0], [0, 1, 0]]);
  assert.equal(manager.deleteSelectedLineVertex(), true);
  assert.equal(updates.at(-1).geometry.length, 3);
  const count = updates.length;
  manager.deleteSelectedLineVertex();
  assert.equal(updates.length, count, 'cannot delete below three controls');

  const handle = findLineHandle(manager, 2);
  manager.beginAnnotationEditFromMarker(handle, 2);
  manager.moveActiveAnnotation([1, 0, 0]);
  manager.endAnnotationEdit();
  assert.equal(updates.length, count, 'collinear edits are rolled back');
  assert.deepEqual(handle.position.toArray(), [0, 2, 0]);
  manager.beginAnnotationEditFromMarker(handle, 2);
  manager.moveActiveAnnotation([0, 0, 0]);
  manager.endAnnotationEdit();
  assert.deepEqual(handle.position.toArray(), [0, 2, 0], 'duplicate controls are rolled back');
  manager.beginAnnotationEditFromMarker(handle, 2);
  manager.moveActiveAnnotation([0, 3, 1]);
  manager.endAnnotationEdit();
  assert.deepEqual(updates.at(-1).geometry[2], [0, 3, 1]);
  manager.setEditingEnabled(false);
  assert.equal(findHandleGroup(manager).visible, false);
  assert.equal(manager.beginAnnotationEditFromMarker(handle, 2), false);
  assert.equal(manager.insertLineVertexFromMarker(hit, 2, [0, 1, 0]), false);
  manager.dispose();
});

test('surface-following areas retain sparse controls and sample the closing edge on create and edit', () => {
  const manager = new AnnotationManager(new THREE.Scene());
  manager.setSurfacePathProjector((controls) => controls.flatMap((point, index) => index === 0
    ? [[...point]]
    : [point.map((value, axis) => (value + controls[index - 1][axis]) / 2), [...point]]));
  manager.setLineSurfaceFollowEnabled(true);
  const controls = [[0, 0, 0], [2, 0, 0], [0, 2, 0]];
  controls.forEach((point) => manager.addLineDraftVertex(point, true));
  const draft = manager.finalizeLineDraft();
  assert.equal(draft.geometry.length, 6);
  assert.deepEqual(draft.geometry.at(-1), [0, 1, 0]);
  assert.deepEqual(draft.surfacePath.controlVertices, controls);
  manager.render([{ id: 'line-1', label: 'Area', type: 'area', ...draft }]);
  manager.select(['line-1']);
  assert.equal(findHandleGroup(manager).children.length, 3);
  const updates = [];
  manager.onAnnotationUpdated((annotation) => updates.push(annotation));
  assert.equal(manager.insertLineVertexFromMarker(findLineRole(manager, 'line-hit'), 5, [-1, 1, 0]), true);
  assert.deepEqual(updates.at(-1).surfacePath.controlVertices, [...controls, [-1, 1, 0]]);
  assert.equal(updates.at(-1).geometry.length, 8);
  manager.deleteSelectedLineVertex();
  assert.deepEqual(updates.at(-1).surfacePath.controlVertices, controls);
  manager.beginAnnotationEditFromMarker(findLineHandle(manager, 0), 0);
  manager.moveActiveAnnotation([-2, 0, 0]);
  manager.endAnnotationEdit();
  assert.deepEqual(updates.at(-1).geometry.at(-1), [-1, 1, 0]);
  manager.dispose();
});

test('area input uses single-click placement, finish/cancel keys, and the shared camera lock', async (t) => {
  const { InputController } = await import('../dist/three-presenter.js');
  const previous = { window: globalThis.window, document: globalThis.document, HTMLElement: globalThis.HTMLElement };
  t.after(() => Object.assign(globalThis, previous));
  const listeners = new Map();
  const events = {
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
  };
  globalThis.window = events;
  globalThis.document = { ...previous.document, ...events };
  globalThis.HTMLElement = class {};
  const element = {
    ...events, style: {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => true,
  };
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 5;
  camera.updateMatrixWorld();
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial());
  const locks = [];
  let picks = 0, completed = 0, cancelled = 0;
  const controller = new InputController({
    domElement: element, getCamera: () => camera, getModels: () => [mesh], getAnnotations: () => [],
    onModelClick: () => picks++, onModelDoubleClick: () => assert.fail('must not recenter'),
    onAnnotationClick() {}, onBackgroundClick() {},
    onAnnotationCreationComplete: () => completed++, onAnnotationCreationCancel: () => cancelled++,
    onAnnotationDragLockChange: (locked) => locks.push(locked),
  });
  controller.setAnnotationCreationMode('area');
  assert.equal(element.style.cursor, 'crosshair');
  const event = { clientX: 50, clientY: 50, button: 0, pointerId: 1, preventDefault() {}, stopPropagation() {} };
  listeners.get('pointerdown')(event);
  listeners.get('pointerup')(event);
  assert.deepEqual(locks, [true, false]);
  controller.handleClick({ ...event, detail: 1 });
  controller.handleClick({ ...event, detail: 2 });
  assert.equal(picks, 1);
  controller.handleDoubleClick(event);
  listeners.get('keydown')({ ...event, key: 'Enter' });
  assert.equal(completed, 2);
  const input = new globalThis.HTMLElement();
  input.tagName = 'INPUT';
  listeners.get('keydown')({ ...event, key: 'Enter', target: input });
  assert.equal(completed, 2, 'typing in a form must not finish a boundary');
  listeners.get('keydown')({ ...event, key: 'Escape' });
  assert.equal(cancelled, 1);
  listeners.get('pointerdown')(event);
  controller.setAnnotationCreationMode('line');
  assert.deepEqual(locks, [true, false, true, false], 'switching tools releases the camera');
  controller.dispose();
  mesh.geometry.dispose();
  mesh.material.dispose();
});

test('selected line handles use the configured screen-space diameter', () => {
  const manager = createSelectedLineManager();
  const handle = findLineHandle(manager, 1);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.updateMatrixWorld();

  manager.updateMarkerScales(camera, 1000);

  const handleWorldPosition = handle.getWorldPosition(new THREE.Vector3());
  const worldUnitsPerPixel = camera.position.distanceTo(handleWorldPosition)
    * Math.tan(20 * Math.PI / 180) * 2 / 1000;
  const visibleDiameter = (24 * 2 + 8) / 64;
  const renderedDiameter = (handle.scale.x / worldUnitsPerPixel) * visibleDiameter;
  assert.ok(Math.abs(renderedDiameter - manager.getConfig().lineVertexSize) < 0.001);
  manager.dispose();
});

test('surface-following lines retain sparse controls and regenerate dense vertices', () => {
  const manager = new AnnotationManager(new THREE.Scene());
  manager.setSurfacePathProjector((controls) => {
    const vertices = [[...controls[0]]];
    for (let index = 1; index < controls.length; index += 1) {
      const start = controls[index - 1];
      const end = controls[index];
      vertices.push([
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2,
        (start[2] + end[2]) / 2 + 1,
      ]);
      vertices.push([...end]);
    }
    return vertices;
  });
  manager.setLineSurfaceFollowEnabled(true);
  manager.addLineDraftVertex([0, 0, 0]);
  manager.addLineDraftVertex([4, 0, 0]);
  const draft = manager.finalizeLineDraft();

  assert.deepEqual(draft?.geometry, [[0, 0, 0], [2, 0, 1], [4, 0, 0]]);
  assert.deepEqual(draft?.surfacePath?.controlVertices, [[0, 0, 0], [4, 0, 0]]);

  manager.render([{
    id: 'line-1',
    label: 'Surface line',
    type: 'line',
    geometry: draft.geometry,
    surfacePath: draft.surfacePath,
  }]);
  manager.select(['line-1']);
  const handles = findHandleGroup(manager);
  assert.equal(handles.children.length, 2);

  const updates = [];
  manager.onAnnotationUpdated((annotation) => updates.push(annotation));
  const endHandle = findLineHandle(manager, 1);
  assert.equal(manager.beginAnnotationEditFromMarker(endHandle, 1), true);
  manager.moveActiveAnnotation([6, 0, 0]);
  manager.endAnnotationEdit();
  assert.deepEqual(updates.at(-1).surfacePath.controlVertices, [[0, 0, 0], [6, 0, 0]]);
  assert.deepEqual(updates.at(-1).geometry, [[0, 0, 0], [3, 0, 1], [6, 0, 0]]);

  const hitLine = findLineRole(manager, 'line-hit');
  assert.equal(manager.insertLineVertexFromMarker(hitLine, 1, [3, 0, 0]), true);
  assert.deepEqual(updates.at(-1).surfacePath.controlVertices, [[0, 0, 0], [3, 0, 0], [6, 0, 0]]);
  assert.equal(manager.deleteSelectedLineVertex(), true);
  assert.deepEqual(updates.at(-1).surfacePath.controlVertices, [[0, 0, 0], [6, 0, 0]]);
  manager.dispose();
});

test('occluded line has a contrasting dashed pass restricted to greater depth', () => {
  const manager = createSelectedLineManager();
  const occludedUnderlay = findLineRole(manager, 'line-occluded-underlay');
  const occludedLine = findLineRole(manager, 'line-occluded');
  const visibleLine = findLineRole(manager, 'line-visible');
  const config = manager.getConfig();

  for (const line of [occludedUnderlay, occludedLine]) {
    assert.equal(line.material.depthFunc, THREE.GreaterDepth);
    assert.equal(line.material.depthWrite, false);
    assert.equal(line.material.dashed, true);
    assert.ok(line.material.dashScale > 0);
    assert.ok(line.geometry.getAttribute('instanceDistanceEnd'));
  }
  assert.equal(occludedUnderlay.material.linewidth, config.lineOccludedUnderlayWidth);
  assert.equal(occludedLine.material.linewidth, config.lineOccludedWidth);
  assert.equal(occludedLine.material.opacity, config.lineOccludedOpacity);
  assert.ok(occludedLine.renderOrder < visibleLine.renderOrder);
  assert.ok(occludedUnderlay.renderOrder < occludedLine.renderOrder);
  manager.dispose();
});

test('cancel restores the edit-start geometry without publishing an update', () => {
  const manager = createSelectedLineManager();
  const handle = findLineHandle(manager, 1);
  const starts = [];
  const updates = [];
  manager.onAnnotationEditStart((annotation) => starts.push(annotation));
  manager.onAnnotationUpdated((annotation) => updates.push(annotation));

  assert.equal(manager.beginAnnotationEditFromMarker(handle, 1), true);
  assert.equal(handle.userData.annotationEditActive, true);
  assert.equal(handle.material.color.getHex(), manager.getConfig().selectedPointStrokeColor);
  manager.moveActiveAnnotation([4, 5, 6]);
  assert.deepEqual(handle.position.toArray(), [4, 5, 6]);

  assert.equal(manager.cancelAnnotationEdit(), true);
  assert.deepEqual(handle.position.toArray(), [1, 0, 0]);
  assert.equal(handle.userData.annotationEditActive, true);
  assert.equal(starts.length, 1);
  assert.deepEqual(starts[0].geometry, [[0, 0, 0], [1, 0, 0], [2, 0, 0]]);
  assert.equal(updates.length, 0);
  manager.dispose();
});

test('double-click topology operation inserts a vertex after the targeted segment', () => {
  const manager = createSelectedLineManager();
  const hitLine = findLineRole(manager, 'line-hit');
  const starts = [];
  const updates = [];
  manager.onAnnotationEditStart((annotation) => starts.push(annotation));
  manager.onAnnotationUpdated((annotation) => updates.push(annotation));

  assert.equal(manager.insertLineVertexFromMarker(hitLine, 0, [0.5, 1, 0]), true);
  assert.equal(starts.length, 1);
  assert.deepEqual(starts[0].geometry, [[0, 0, 0], [1, 0, 0], [2, 0, 0]]);
  assert.equal(updates.length, 1);
  assert.deepEqual(updates[0].geometry, [[0, 0, 0], [0.5, 1, 0], [1, 0, 0], [2, 0, 0]]);

  const insertedHandle = findLineHandle(manager, 1);
  assert.deepEqual(insertedHandle.position.toArray(), [0.5, 1, 0]);
  assert.equal(insertedHandle.userData.annotationEditActive, true);
  manager.dispose();
});

test('Delete removes the selected vertex but preserves the two-vertex minimum', () => {
  const manager = createSelectedLineManager();
  const handle = findLineHandle(manager, 1);
  const starts = [];
  const updates = [];
  manager.onAnnotationEditStart((annotation) => starts.push(annotation));
  manager.onAnnotationUpdated((annotation) => updates.push(annotation));

  assert.equal(manager.selectLineVertexFromMarker(handle, 1), true);
  assert.equal(manager.deleteSelectedLineVertex(), true);
  assert.equal(starts.length, 1);
  assert.equal(updates.length, 1);
  assert.deepEqual(updates[0].geometry, [[0, 0, 0], [2, 0, 0]]);

  assert.equal(manager.deleteSelectedLineVertex(), true);
  assert.equal(starts.length, 1);
  assert.equal(updates.length, 1);
  manager.dispose();
});

test('topology editing is rejected outside edit mode', () => {
  const manager = createSelectedLineManager();
  const handle = findLineHandle(manager, 1);
  const hitLine = findLineRole(manager, 'line-hit');
  const updates = [];
  manager.onAnnotationUpdated((annotation) => updates.push(annotation));

  manager.setEditingEnabled(false);
  assert.equal(manager.selectLineVertexFromMarker(handle, 1), false);
  assert.equal(manager.insertLineVertexFromMarker(hitLine, 0, [0.5, 1, 0]), false);
  assert.equal(manager.deleteSelectedLineVertex(), false);
  assert.equal(updates.length, 0);
  manager.dispose();
});

test('completed edits publish exactly one cloned geometry update', () => {
  const manager = createSelectedLineManager();
  const handle = findLineHandle(manager, 1);
  const updates = [];
  manager.onAnnotationUpdated((annotation) => updates.push(annotation));

  assert.equal(manager.beginAnnotationEditFromMarker(handle, 1), true);
  manager.moveActiveAnnotation([4, 5, 6]);
  manager.endAnnotationEdit();
  manager.endAnnotationEdit();

  assert.equal(updates.length, 1);
  assert.deepEqual(updates[0].geometry, [[0, 0, 0], [4, 5, 6], [2, 0, 0]]);
  manager.moveActiveAnnotation([9, 9, 9]);
  assert.deepEqual(updates[0].geometry, [[0, 0, 0], [4, 5, 6], [2, 0, 0]]);
  manager.dispose();
});

test('leaving edit mode cancels an in-progress geometry change', () => {
  const manager = createSelectedLineManager();
  const handle = findLineHandle(manager, 1);
  const updates = [];
  manager.onAnnotationUpdated((annotation) => updates.push(annotation));

  manager.beginAnnotationEditFromMarker(handle, 1);
  manager.moveActiveAnnotation([7, 8, 9]);
  manager.setEditingEnabled(false);

  assert.deepEqual(handle.position.toArray(), [1, 0, 0]);
  assert.equal(updates.length, 0);
  manager.dispose();
});
