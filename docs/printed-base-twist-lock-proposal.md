# Change request: printed base–shade twist-lock prototype

Status: proposal / draft. No production geometry or application behavior changes in this request.
Branch: feature/printed-base-twist-lock.
Starting point: main at d8402befb7caa5ecc938ae1e29624da381b8c8be.

## Problem and intended experience

AKŌI can generate printable bases, but its current base–shade connection assumes matching magnet pockets. Add a removable mechanical connection for printed bases, allowing someone to lower a shade onto a base and turn it into a clearly locked position.

Keep magnets available for wooden and printed bases. Existing projects retain their current geometry and attachment mode. Develop on this branch, demonstrate the result for review, and merge only after the user requests it. Do not deploy or merge this proposal.

## Research basis

Manufacturer descriptions support the assembly experience but do not supply validated dimensions for AKŌI:

- Printit SwitchShade fits over four pre-installed screws and twists into place; its published construction combines a PETG base and PLA shade. Tool-free use need not mean hardware-free manufacture.
  https://www.printit.nu/en/products/bordslampa
- Namami describes a common twist-lock fitting across shades, cord sets, and bases. The internal geometry is not established by that description.
  https://namami.studio/pages/faqs
- BLOB LIGHTS advertises tool-free twist-to-click assembly; detailed retention geometry and testing are not published on the reviewed product page.
  https://www.bloblights.com/products/l-01-lamp
- VNEN Lumo uses hidden magnets with printed bases and interchangeable shades. Retain this option for printed bases.
  https://www.vnen.de/collections/tischlampen-lumo-kollektion

Engineering references:

- Protolabs: creep, fatigue, stress concentrations, material choice, build direction, and process-dependent clearances.
  https://www.hubs.com/knowledge-base/how-design-snap-fit-joints-3d-printing/
- Formlabs: distinguish clearance from manufacturing variation and iterate matching parts.
  https://formlabs.com/blog/how-to-3d-print-interlocking-joints/
- Prusa: orientation, overhangs, lead-in chamfers, and first-layer widening affect fit.
  https://help.prusa3d.com/article/modeling-with-3d-printing-in-mind_164135
  https://help.prusa3d.com/en/article/elephant-foot-compensation_114487
- Prusa: PETG is a candidate for mechanical parts, with bridging and overhang limitations.
  https://help.prusa3d.com/article/petg_2059
- MILNEC: industrial bayonets separate locating, engagement, retention, and coupling feedback through keys, pins, ramps, and detents. Their metal construction, dimensions, and performance must not be transferred directly to printed lamps.
  https://www.milnec.com/mil-spec-connector-learning-center/mil-spec-connector-coupling-styles/

These are primary-source descriptions and design guidance, not evidence that any proposed AKŌI geometry has been physically validated.

## Proposed mechanism

Prototype a concealed circular bayonet interface with:

1. A locating collar to center the shade and constrain sideways movement.
2. A seating shoulder to support normal downward shade weight.
3. Three substantial, reinforced lugs and matching entry slots/retaining ledges.
4. Lead-in chamfers for easy insertion.
5. A hard rotation stop defining the end position.
6. A separately designed anti-reverse feature, such as a low-strain detent, to resist accidental unlocking.
7. Discreet insertion and locked-position marks; a keyed entry if final orientation requires it.

A stop alone does not prevent reverse rotation. Avoid relying solely on friction or on thin clips held permanently flexed. Treat approximately 30 degrees as a prototype candidate, not an approved final angle.

Design the intended print orientation alongside the geometry. Check lug roots, channel roofs, layer loads, support access, and first-layer relief. If an integral connection prints poorly, evaluate a mechanically secured, replaceable collar; validate that additional attachment too. Do not promise support-free printing before slicer inspection.

Start with round mounting interfaces. Square/oval decorative shapes require full-motion collision and final-alignment checks before support is advertised.

## Fit, materials, and compatibility

- Generate both mating halves from one shared, versioned connection specification.
- Keep radial gap, axial gap, entry allowance, and retention interference distinct. Define per-side vs total-diameter dimensions explicitly.
- Determine dimensions using test prints. A possible radial per-side coupon sweep is 0.20/0.30/0.40/0.50 mm; these are experimental values, not approved settings.
- Use defined connection sizes so decorative resizing cannot silently invalidate previously printed parts.
- Check the entire insertion/rotation/removal path against the holder, cable, diffuser, decorative surfaces, and required wall sections.
- Keep the holder/cable stationary during shade rotation and preserve appropriate purchased electrical hardware and strain relief.
- Do not silently shrink a socket opening or remove functional material to make the connector fit.
- Preserve existing saved projects, magnet pockets, project imports, and exports. Twist mode needs independent geometry and fit rules, not the current magnet-success indicator.
- PETG is a prototype candidate, not a guarantee of heat suitability. Qualify the actual bulb, holder, ventilation, material, and geometry; do not copy another lamp's wattage rating.

## App integration after connector testing

Use the existing Parts & fit stage:

- Connection choice: Magnets / Twist lock (experimental until validated).
- Automatic matching of shade and base from the same specification.
- Inspect connection: enlarged cutaway/exploded view and insertion/rotation demonstration.
- Print a fit sample: small full-diameter matching collars reproducing the real interface and intended print orientation.
- Fit feedback: Too tight / Good / Too loose, with detailed controls under Advanced. Fit feedback alone does not establish retention strength.
- Matched exports identifying connection size/version and editable-project persistence.
- Distinguish a geometric compatibility result from physical validation.

## Work sequence and acceptance checklist

### Phase 1 — connector-only prototype

- [ ] Implement printable matching collar samples and an inspectable digital assembly.
- [ ] Verify closed/manifold meshes, no self-intersections, section thickness, engagement, and clearance through the entire movement.
- [ ] Inspect actual sliced orientation and support requirements.
- [ ] Print samples and measure radial fit, axial play, insertion/removal effort, reverse-unlock resistance, and pull-off retention.
- [ ] Iterate before committing to complete lamp geometry.

### Phase 2 — matched lamp and app integration

- [ ] Integrate a proven round interface into shade/base generators and shared project data.
- [ ] Add connection selection, inspection, calibration, compatible exports, and save/load migration.
- [ ] Test old magnet projects and all existing geometry/export behavior.
- [ ] Run build, TypeScript, and relevant regression checks.
- [ ] Review appearance, responsive UI, and real 3D rendering in a browser.

### Phase 3 — physical review and release

- [ ] Test full lamps for wobble, accidental rotation, bulb-changing motions, cable/diffuser clearance, and damage under excess torque.
- [ ] Define load/torque acceptance thresholds from the actual design and use.
- [ ] Perform repeated-cycle testing; 100 cycles is a proposed initial screen, not a certification or lifetime claim.
- [ ] Check sustained loading and operating temperature for creep and loss of retention.
- [ ] Review the branch preview with the user before merging or deployment.

Until physical checks are complete, describe the mechanism as experimental. A successful digital fit or room-temperature sample does not establish electrical/thermal safety, safe carrying by the shade, or suitability for hanging.

## Current request boundary

This commit records research, scope, and acceptance criteria only. Implementation, physical tests, visual verification, merging, and deployment remain outstanding.
