# Random shade design

The generator varies ten coordinated design families rather than independently
randomizing sliders. Each uses one dominant silhouette and texture, moderate
detail depth, repeat counts related to circumference, and smooth mounting bands.
Previous families are excluded on the next click. Socket diameter and wall
thickness stay unchanged; the bottom width grows when needed to retain its rim.
Results remain ordinary editable parameters and use the existing undo history.

Design references reviewed October 5, 2026:

- Sam Gwilt, Encore: curtain-inspired pleats and a geometric base.
  https://www.samdoes.design/encore
- Lynn Lin, KAMIII: the pleated paper lamp interpreted through 3D printing.
  https://www.lynnlinstudio.com/kamiii
- BEBOP, Stack: simple soft geometric blocks and print-volume-aware composition.
  https://www.bebop.kr/project/gantri-stack
- Carlos Jiménez, Persiana: a stepped shade inspired by horizontal wooden blinds.
  https://www.carlosjimenezdesign.com/en/persiana
- Original Prusa lighting contest: open printed structures and diverse forms.
  https://blog.prusa3d.com/lights-and-3d-printing-contest-evaluation-with-tips-for-modern-3d-printed-lighting_38752/

These inform our aesthetic choices, not replicas or guarantees of printability.
The existing Print panel remains necessary to check dimensions and slopes for
the user's printer; open textures require slicer review. No vase-mode claim is
made. Magnet dimensions are enforced by the shared geometry builder and checked
after binary STL re-import in `scripts/verify-random-shade.mjs`.
