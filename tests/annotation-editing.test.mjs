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
  ({ AnnotationManager } = await import('../dist/three-presenter.js'));
});

function createSelectedLineManager() {
  const manager = new AnnotationManager(new THREE.Scene());
  manager.render([{
    id: 'line-1',
    label: 'Test line',
    type: 'line',
    geometry: [[0, 0, 0], [1, 0, 0], [2, 0, 0]],
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
