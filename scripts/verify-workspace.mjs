import assert from 'node:assert/strict';
import { createProjectHistory } from '../lib/project-history.mjs';
import {
  validateProject,
  restoreProject,
  currentProject,
} from '../lib/design-project.mjs';
import { DEFAULTS, applyParameterPatch } from '../lib/model.mjs';
import { BASE_DEFAULTS, patchBase } from '../lib/base-model.mjs';
import { mushroomProject } from '../lib/mushroom-project.mjs';
import {
  createPreviewBuilder,
  PREVIEW_RESOLUTION,
} from '../lib/preview-model.mjs';
import { generateDiffuser, layeredShade } from '../lib/diffuser-model.mjs';

const original = validateProject({
  format: 'akoi-design',
  version: 1,
  shade: DEFAULTS,
  base: BASE_DEFAULTS,
});
const history = createProjectHistory(original);
const shade = {
  ...original,
  shade: applyParameterPatch(original.shade, { height: 210 }),
};
history.commit(shade);
const base = { ...shade, base: patchBase(shade.base, { height: 40 }) };
history.commit(base);
const complete = {
  ...base,
  lidEnabled: true,
  diffuserEnabled: true,
  finishes: { ...base.finishes, shade: '#f4eddf' },
};
history.commit(complete);
assert.deepEqual(
  history.undo(),
  base,
  'undo restores optional parts and finishes together',
);
assert.deepEqual(history.undo(), shade, 'undo crosses part boundaries');
assert.deepEqual(
  history.undo(),
  original,
  'undo restores the complete original project',
);
assert.deepEqual(history.redo(), shade);
assert.deepEqual(history.redo(), base);
assert.deepEqual(history.redo(), complete);

history.replace(original);
history.begin();
for (let height = 201; height <= 300; height++)
  history.commit({
    ...history.current,
    shade: applyParameterPatch(history.current.shade, { height }),
  });
history.end();
assert.equal(history.current.shade.height, 300);
assert.deepEqual(
  history.undo(),
  original,
  'one continuous slider adjustment is one undo step',
);
assert.equal(
  history.canUndo,
  false,
  'a long slider gesture does not fill the undo history',
);
history.commit(mushroomProject());
assert.equal(
  history.canRedo,
  false,
  'a new edit clears the abandoned redo branch',
);
assert.deepEqual(
  history.undo(),
  original,
  'whole-lamp template is fully recoverable',
);
history.commit(original);
assert.equal(
  history.canUndo,
  false,
  'unchanged settings do not add undo steps',
);

const values = new Map(),
  storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
restoreProject(storage, complete);
assert.deepEqual(
  currentProject(storage),
  complete,
  'all parameters, optional parts, and finishes retain the existing project format',
);
assert.equal(complete.format, 'akoi-design');
assert.equal(complete.version, 1);
const preview = createPreviewBuilder();
const diffuser = preview('diffuser', complete.diffuser);
const expectedDiffuser = generateDiffuser(
  complete.diffuser,
  PREVIEW_RESOLUTION,
);
assert.deepEqual(diffuser.positions, expectedDiffuser.positions);
assert.deepEqual(diffuser.indices, expectedDiffuser.indices);
assert.equal(
  preview('diffuser', { ...complete.diffuser }),
  diffuser,
  'standalone diffuser inspection reuses existing preview geometry',
);
const layerInput = {
  shade: complete.shade,
  diffuser: complete.diffuser,
  mode: 'both',
  color: complete.finishes.shade,
  innerColor: '#343331',
};
const layers = preview('layered', layerInput);
const expectedLayers = layeredShade(
  preview('shade', complete.shade),
  complete.diffuser,
  layerInput.mode,
  layerInput.color,
  layerInput.innerColor,
);
assert.deepEqual(layers.positions, expectedLayers.positions);
assert.deepEqual(
  layers.colors,
  expectedLayers.colors,
  'layer inspection preserves both chosen finishes',
);
console.log(
  'PASS: project-wide undo/redo, single-step slider gestures, template recovery, editable-project compatibility, diffuser preview routing, and layer finishes.',
);
