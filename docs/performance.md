# Processing and export performance

STLs are generated when Export is pressed, rather than automatically after every
edit or when an editor opens. An unchanged design reuses its prepared file.
Changing parameters terminates any export in progress, discards obsolete results,
and releases the previous download URL. The exporter worker exits after finishing.
Repeated clicks share one job and one download.

Shade, base, lid and assembly geometry runs in preview workers. A worker runs one
request at a time and keeps only the latest pending edit. Optional diffuser and
E27 fit checks run in separate workers only when relevant. Preview normals and
shade overhang analysis also run away from the browser's main thread.

Interactive meshes use fewer samples, with bounded clay and fuzzy texture
resolution. Full-quality export resolution is unchanged. Preview geometry is an
editing aid; inspect the final STL in your slicer. Assembly spacing and finish
changes reuse unchanged part geometry. The renderer redraws on interaction,
geometry/appearance changes and resizing; stationary views do not run a continuous
render loop. Shadows update when geometry changes.

Woven generation reuses repeated radial-bound calculations at band interfaces.
Binary STL serialization avoids allocating small arrays for every triangle.
Workers use Vite's explicit worker imports so the framework cannot rewrite their
URLs into inaccessible file URLs.

## Measurements

Single-pass Node measurements on the development machine, not a guarantee for
other devices. Geometry timings exclude GPU rendering, startup and download I/O.

| Operation | Before | After |
| --- | ---: | ---: |
| Bell preview generation | 71 ms / 202,368 triangles | 16 ms / 52,224 triangles |
| Fine clay preview generation | 661 ms / 1,812,864 triangles | 76 ms / 152,832 triangles |
| Woven export geometry generation | 3,093 ms | 1,883 ms |
| Woven STL serialization | 92 ms | 61 ms |

Browser checks found zero export workers before Export was pressed and zero
animation callbacks per second after the stationary WebGL view settled. Editing
after an export did not start another export; downloading again without changes
reused the existing file.

## Verification

- `node scripts/verify-export-task.mjs`: lazy generation, duplicate requests,
  cancellation, stale worker replies/errors, cache reuse, URL release, retry,
  and unmount cleanup.
- `node scripts/verify-preview-performance.mjs`: manifold preview meshes,
  texture budgets, assembly geometry reuse and selective invalidation.
- Existing geometry, base, lid, layered, saved-design/assembly and mushroom/E27
  verification scripts passed.
- SHA-256 comparisons against the previous source confirmed byte-for-byte
  identical STLs for bell, cube, mushroom, woven, base, lid and diffuser examples.
- TypeScript and production build passed. New hooks and preview worker passed
  their ESLint checks; the project has existing lint errors elsewhere.
- Chromium checked preview loading and STL downloads on all editors, export
  after a dimension change, cached repeat downloads and exploded assembly.

Modern Web Worker support is required. Failure reports an error instead of
silently running a dense export on the browser's main thread.
