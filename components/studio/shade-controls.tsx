'use client';
import { useState, useEffect, useMemo } from 'react';
import { Download, Check, Magnet } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Slider } from './slider';
import { usePreparedSTL } from '@/hooks/use-prepared-stl';
import {
  useLampProject,
  type Stage,
  type Part,
  type Project,
} from './project-context';
import { ShapePicker, TexturePicker } from './pickers';
import {
  DIFFUSER_DEFAULTS,
  DIFFUSER_LIMITS,
  diffuserFit,
  matchDiffuser,
} from '@/lib/diffuser-model.mjs';
import { maxPanelRibs } from '@/lib/flowing-folds.mjs';
import {
  DEFAULTS,
  LIMITS,
  PRESETS,
  maxSocketDiameter,
  sectionScale,
  maxSmoothArea,
} from '@/lib/model.mjs';
type Params = typeof DEFAULTS;
type ParamKey = keyof typeof LIMITS;
function Control({
  name,
  label,
  unit = '',
  p,
  onChange,
  note,
}: {
  name: ParamKey;
  label: string;
  unit?: string;
  p: Params;
  onChange: (patch: Partial<Params>) => void;
  note?: string;
}) {
  const [baseMin, baseMax, step] = LIMITS[name],
    min =
      name === 'depthRatio'
        ? Math.max(baseMin, Math.ceil((38 / p.diameter) * 100))
        : baseMin,
    max =
      name === 'panelRibCount'
        ? maxPanelRibs(p)
        : name === 'socketDiameter'
          ? maxSocketDiameter(p)
          : ['smoothBottom', 'smoothTop'].includes(name)
            ? maxSmoothArea(p)
            : baseMax,
    value = p[name];
  const [draft, setDraft] = useState(String(value));
  // Keep the number-field draft in sync with sliders, templates, and undo.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const num = Number(draft);
    if (
      draft.trim() !== '' &&
      Number.isFinite(num) &&
      num >= min &&
      num <= max &&
      (step !== 1 || Number.isInteger(num))
    )
      onChange({ [name]: num });
    else {
      setDraft(String(value));
      toast.error(
        `${label}: enter ${min}–${max}${unit ? ' ' + unit : ''}${step === 1 ? ' in whole numbers' : ''}.`,
      );
    }
  };
  return (
    <div className="control">
      <div className="control-head">
        <label htmlFor={name}>{label}</label>
        <div className="number-wrap">
          <input
            id={name}
            aria-label={label}
            type="number"
            min={min}
            max={max}
            step={step}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') {
                setDraft(String(value));
                e.currentTarget.blur();
              }
            }}
          />
          <span>{unit}</span>
        </div>
      </div>
      <Slider
        aria-label={`${label} slider`}
        className="precision-slider"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange({ [name]: v[0] })}
      />
      {note && <p className="control-note">{note}</p>}
    </div>
  );
}
function DiffuserControl({
  name,
  label,
  p,
  onChange,
}: {
  name: keyof typeof DIFFUSER_LIMITS;
  label: string;
  p: typeof DIFFUSER_DEFAULTS;
  onChange: (patch: Partial<Project['diffuser']>) => void;
}) {
  const [min, max, step] = DIFFUSER_LIMITS[name],
    value = p[name],
    [draft, setDraft] = useState(String(value)); // Keep the number-field draft in sync with sliders, templates, and undo.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const number = Number(draft);
    if (
      draft.trim() &&
      Number.isFinite(number) &&
      number >= min &&
      number <= max &&
      (step !== 1 || Number.isInteger(number))
    )
      onChange({ [name]: number });
    else toast.error(`${label}: enter ${min}–${max} mm.`);
    setDraft(String(value));
  };
  return (
    <div className="control">
      <div className="control-head">
        <label htmlFor={`diffuser-${name}`}>{label}</label>
        <div className="number-wrap">
          <input
            id={`diffuser-${name}`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') {
                setDraft(String(value));
                e.currentTarget.blur();
              }
            }}
          />
          <span>mm</span>
        </div>
      </div>
      <Slider
        aria-label={`${label} slider`}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange({ [name]: v[0] })}
      />
    </div>
  );
}

export default function ShadeControls({
  section,
  setView,
  navigate,
}: {
  section: 'form' | 'surface' | 'build' | 'diffuser';
  setView: (view: string) => void;
  navigate: (stage: Stage, part: Part) => void;
}) {
  const { project, edit } = useLampProject();
  const p = project.shade;
  const change = (patch: Partial<Params>) => edit('shade', patch);
  const baseRadius = p.diameter / 2,
    baseMinRadius = baseRadius * Math.min(1, p.depthRatio / 100),
    diagramScale = 85 / (baseRadius * Math.max(1, p.depthRatio / 100) * 1.42);
  const baseOutline =
    Array.from({ length: 128 }, (_, i) => {
      const a = (i / 128) * Math.PI * 2,
        r = baseRadius * sectionScale(p, a);
      return `${i ? 'L' : 'M'} ${120 + r * Math.cos(a) * diagramScale} ${105 + r * Math.sin(a) * diagramScale}`;
    }).join(' ') + ' Z';
  const widthLabel =
    ['cube', 'pyramid', 'hexagon', 'oval', 'rounded-square'].includes(
      p.shape,
    ) || p.depthRatio !== 100;
  const c = (name: ParamKey, label: string, unit = '', note?: string) => (
    <Control
      key={name}
      name={name}
      label={label}
      unit={unit}
      p={p}
      onChange={change}
      note={note}
    />
  );
  if (section === 'form')
    return (
      <>
        <section className="control-section">
          <ShapePicker
            value={p.shape}
            onChange={(shape) => {
              const preset = {
                ...PRESETS[shape as keyof typeof PRESETS],
              } as Record<string, string | number | boolean>;
              delete preset.socketDiameter;
              change({ ...preset, shape });
              setView('perspective');
            }}
          />
        </section>
        <section className="control-section">
          <h2>Dimensions</h2>
          {c('height', 'Height', 'mm')}
          {c('diameter', widthLabel ? 'Bottom width' : 'Bottom diameter', 'mm')}
          {c('topDiameter', widthLabel ? 'Top width' : 'Top diameter', 'mm')}
        </section>
        <section className="control-section">
          <h2>Profile</h2>
          {p.shape === 'mushroom' && (
            <>
              {c('capDiameter', 'Cap brim diameter', 'mm')}
              {c(
                'capRise',
                'Underside flare height',
                'mm',
                'Joins the mounting rim to the wide brim. Check supports in the slicer.',
              )}
              {c(
                'capRoundness',
                'Cap roundness',
                '%',
                '0 gives a conical cap; higher values soften the crown.',
              )}
              <button
                className="inspect-bottom"
                onClick={() => navigate('parts', 'base')}
              >
                Edit stem & E27 mount
              </button>
            </>
          )}
          {p.shape === 'flowing-folds' && (
            <>
              {c('foldCount', 'Fold count')}
              {c('foldDepth', 'Fold depth', 'mm')}
              {c(
                'foldWaist',
                'Waist depth',
                'mm',
                'Draws the middle inward to separate the upper and lower bulges.',
              )}
              {c(
                'foldRotation',
                'Spiral rotation',
                '°',
                'Turn the broad folds from bottom to top. Negative values reverse the direction.',
              )}
              {c(
                'foldSoftness',
                'Fold softness',
                '%',
                'Higher values make broader, rounder folds.',
              )}
              <details className="editor-disclosure">
                <summary>
                  Fold movement & blending
                  {p.foldSway ||
                  p.foldVariation ||
                  p.foldBottomBlend !== DEFAULTS.foldBottomBlend ||
                  p.foldTopBlend !== DEFAULTS.foldTopBlend ? (
                    <span className="disclosure-status">Active</span>
                  ) : null}
                </summary>
                {c(
                  'foldSway',
                  'Fold sway',
                  '°',
                  'Bends the folds gently back and forth along the height.',
                )}
                {c(
                  'foldVariation',
                  'Middle fold softening',
                  '%',
                  'Reduces fold depth in the middle while retaining the upper and lower folds.',
                )}
                {c(
                  'foldBottomBlend',
                  'Bottom blend length',
                  'mm',
                  'Gradually blends the folds into the protected mounting rim.',
                )}
                {c(
                  'foldTopBlend',
                  'Top blend length',
                  'mm',
                  '0 carries the folds to the opening; larger values create a smooth top collar.',
                )}
              </details>
            </>
          )}
          {p.shape === 'rounded-cylinder' && (
            <>
              {c('bodyDiameter', 'Middle diameter', 'mm')}
              {c('bottomShoulder', 'Bottom shoulder height', 'mm')}
              {c('topShoulder', 'Top shoulder height', 'mm')}
              <p className="control-note">
                Straight middle:{' '}
                {p.height - 5 - p.bottomShoulder - p.topShoulder} mm. Keep Curve
                at 0 for straight sides. Body diameter must be at least as wide
                as both ends.
              </p>
            </>
          )}
          {c(
            'curve',
            'Curve',
            'mm',
            'Positive values add fullness. Negative values draw the waist inward.',
          )}
        </section>
        {['stacked', 'sculpted'].includes(p.shape) && (
          <section className="control-section">
            <h2>
              {p.shape === 'stacked' ? 'Stacked volume' : 'Sculpted volume'}
            </h2>
            {c('bulgeDepth', 'Profile fullness', 'mm')}
            {p.shape === 'stacked' && c('stackCount', 'Stack count')}
          </section>
        )}
        <details className="editor-disclosure advanced-shape">
          <summary>
            Advanced shape adjustments
            {p.leanX ||
            p.leanY ||
            p.asymmetricBulge ||
            p.lobeDepth ||
            p.twist ||
            p.depthRatio !== 100 ||
            p.lockTop ? (
              <span className="disclosure-status">Active</span>
            ) : null}
          </summary>
          {c('depthRatio', 'Depth / width', '%')}
          <div className="top-lock-control">
            <div className="control-head">
              <label htmlFor="lockTop">Lock top shape</label>
              <Switch
                id="lockTop"
                checked={p.lockTop}
                onCheckedChange={(lockTop) => change({ lockTop })}
                aria-describedby="top-lock-note"
              />
            </div>
            <p id="top-lock-note" className="control-note">
              Keep the top’s original outline and orientation, with a smooth
              rim. Top size remains adjustable.
            </p>
          </div>
          {c(
            'twist',
            'Surface twist',
            '°',
            'Rotates surface details; Flowing folds uses its own Spiral rotation control.',
          )}
          <section>
            <div className="section-label">
              <h2>Asymmetry</h2>
              <span>Mounting rim fixed</span>
            </div>
            {c('leanX', 'Top offset X', 'mm')}
            {c(
              'leanY',
              'Top offset Y',
              'mm',
              'Moves the upper body sideways; the bottom stays centered and flat.',
            )}
            {c('asymmetricBulge', 'One-sided fullness', 'mm')}
            {c(
              'bulgePosition',
              'Fullness height',
              '%',
              'Position of the bulge from bottom to top.',
            )}
            {c('bulgeDirection', 'Fullness direction', '°')}
          </section>
          <section className="control-section">
            <h2>Uneven outline</h2>
            {c('lobeDepth', 'Outline variation', 'mm')}
            {c(
              'lobeCount',
              'Lobes around',
              '',
              'Adds an organic, uneven outline to the body.',
            )}
          </section>
          <p className="base-note">
            Top shape lock preserves the top outline. Sideways offsets can still
            move its center. Use Review → Printer checks to review size and
            slopes.
          </p>
        </details>
      </>
    );
  if (section === 'surface')
    return (
      <>
        <section>
          <div className="section-label">
            <h2>Surface texture</h2>
            <span>Actual geometry</span>
          </div>

          <TexturePicker
            value={p.texture}
            onChange={(texture) => change({ texture })}
          />
          {p.texture === 'mesh' && (
            <div className="texture-controls">
              <p className="mesh-note">
                Open diamond lattice: light passes through real holes. Solid
                bands protect the top and bottom rims.
              </p>
              {c('meshColumns', 'Openings around')}
              {c('meshRows', 'Rows of openings')}
              {c(
                'meshOpening',
                'Opening size',
                '%',
                'Larger openings make finer lattice bars.',
              )}
            </div>
          )}
          {p.texture === 'woven' && (
            <div className="texture-controls">
              <p className="mesh-note">
                Continuous wavy bands, stacked with alternating wave positions.
              </p>
              {c('weaveDepth', 'Wave depth', 'mm')}
              {c('weaveStrand', 'Line width', 'mm')}
              {c('weaveColumns', 'Repeats around')}
              {c(
                'weaveRows',
                'Woven rows',
                '',
                `Each band is about ${((p.height - 5 - p.smoothBottom - p.smoothTop) / p.weaveRows).toFixed(1)} mm tall.`,
              )}
              <div className="top-lock-control">
                <div className="control-head">
                  <label htmlFor="weaveOpen">Open weave</label>
                  <Switch
                    id="weaveOpen"
                    checked={p.weaveOpen}
                    onCheckedChange={(weaveOpen) => change({ weaveOpen })}
                  />
                </div>
                <p className="control-note">
                  Allow gaps where neighboring wavy bands separate. Gaps appear
                  when wave depth exceeds line width.
                </p>
              </div>
            </div>
          )}
          {p.texture === 'clay' && (
            <div className="texture-controls">
              <p className="mesh-note">
                Shallow irregular oval impressions, built into the STL. A smooth
                inner wall is inset to retain at least your selected radial wall
                thickness. Mounting areas stay smooth.
              </p>
              {c('clayDepth', 'Mark depth', 'mm')}
              {c('claySize', 'Mark size', 'mm')}
              {c('claySpacing', 'Mark spacing', 'mm')}
              {c('clayStretch', 'Mark length', '×')}
              <button
                className="inspect-bottom"
                onClick={() => change({ claySeed: (p.claySeed + 1) % 10000 })}
              >
                New clay marks
              </button>
            </div>
          )}
          {p.texture === 'fuzzy' && (
            <div className="texture-controls">
              <p className="mesh-note">
                Soft, irregular surface grain built into the STL. The inside
                stays smooth; your selected wall thickness is preserved.
              </p>
              {c('fuzzyDepth', 'Fuzz depth', 'mm')}
              {c(
                'fuzzySpacing',
                'Grain spacing',
                'mm',
                'Smaller spacing makes a finer, denser texture.',
              )}
              {c(
                'fuzzyStretch',
                'Brush length',
                '×',
                '1 gives compact fuzz; higher values stretch the grain vertically.',
              )}
              <button
                className="inspect-bottom"
                onClick={() => change({ fuzzySeed: (p.fuzzySeed + 1) % 10000 })}
              >
                New grain pattern
              </button>
            </div>
          )}
          {['rings', 'bands'].includes(p.texture) && (
            <div className="texture-controls">
              {p.texture === 'bands' && (
                <p className="mesh-note">
                  Broad solid panels with shallow beveled seams. Square shapes
                  keep flat sides. Use a pale translucent filament for a similar
                  illuminated look.
                </p>
              )}
              {c(
                'ringDepth',
                p.texture === 'bands' ? 'Band depth' : 'Ring depth',
                'mm',
              )}
              {c(
                'ringCount',
                p.texture === 'bands' ? 'Band count' : 'Ring count',
              )}
              {c(
                'ringSharpness',
                p.texture === 'bands'
                  ? 'Band edge sharpness'
                  : 'Ring sharpness',
                '%',
                p.texture === 'bands'
                  ? 'Soft, wide seams at 0; narrower, crisper seams at 100.'
                  : 'Rounded at 0; crisp ridges at 100.',
              )}
            </div>
          )}
          {![
            'smooth',
            'mesh',
            'woven',
            'rings',
            'bands',
            'fuzzy',
            'clay',
          ].includes(p.texture) && (
            <div className="texture-controls">
              {c(
                'textureDepth',
                p.shape === 'flowing-folds' &&
                  p.texture === 'fluted' &&
                  p.panelRibs
                  ? 'Rib depth'
                  : 'Texture depth',
                'mm',
              )}
              {p.shape === 'flowing-folds' && p.texture === 'fluted' && (
                <div className="top-lock-control">
                  <div className="control-head">
                    <label htmlFor="panel-ribs">
                      Alternate smooth & ribbed panels
                    </label>
                    <Switch
                      id="panel-ribs"
                      checked={p.panelRibs}
                      onCheckedChange={(panelRibs) => change({ panelRibs })}
                    />
                  </div>
                  <p className="control-note">
                    Ribs stay inside each spiral panel and follow Spiral
                    rotation automatically. Smooth ribbons remain between
                    panels.
                  </p>
                </div>
              )}
              {p.shape === 'flowing-folds' &&
              p.texture === 'fluted' &&
              p.panelRibs ? (
                <>
                  {c(
                    'panelCoverage',
                    'Ribbed panel coverage',
                    '%',
                    'The remaining width stays smooth.',
                  )}
                  {c('panelRibCount', 'Ribs per panel')}
                  <details className="editor-disclosure">
                    <summary>
                      Panel position & edges
                      {p.panelOffset !== DEFAULTS.panelOffset ||
                      p.panelEdge !== DEFAULTS.panelEdge ? (
                        <span className="disclosure-status">Active</span>
                      ) : null}
                    </summary>
                    {c(
                      'panelOffset',
                      'Panel position',
                      '°',
                      'Moves the ribbed region across each broad fold.',
                    )}
                    {c(
                      'panelEdge',
                      'Panel edge softness',
                      '%',
                      'Blends the ribs gradually into the smooth ribbons.',
                    )}
                  </details>
                </>
              ) : (
                c('textureCount', 'Texture repeats')
              )}
            </div>
          )}
        </section>
        <section className="control-section">
          <h2>Texture extent</h2>
          {c(
            'smoothBottom',
            'Bottom smooth area',
            'mm',
            'Measured above the 5 mm base. A 1 mm solid collar protects the bottom.',
          )}
          {c(
            'smoothTop',
            'Top smooth area',
            'mm',
            'Set to 0 to extend the texture to the top edge. Lock top shape still preserves its outline.',
          )}
        </section>
        <details className="editor-disclosure">
          <summary>
            Extra stripes & waves
            {p.stripeDepth || p.waveDepth ? (
              <span className="disclosure-status">Active</span>
            ) : null}
          </summary>
          <section className="control-section">
            <h2>Stripes</h2>
            {c('stripeDepth', 'Stripe depth', 'mm')}
            {c('stripeCount', 'Stripe count')}
            {c('stripeWidth', 'Stripe width', '%')}
          </section>
          <section className="control-section">
            <h2>Waves</h2>
            {c('waveDepth', 'Wave amplitude', 'mm')}
            {c('waveCount', 'Vertical cycles')}
            {c('waveAround', 'Around-body cycles')}
          </section>
        </details>
      </>
    );
  if (section === 'diffuser') return <DiffuserControls />;
  return (
    <>
      <section>
        <div className="section-label">
          <h2>Wall & lamp holder</h2>
          <span>Millimeters</span>
        </div>
        {c('wall', 'Wall thickness', 'mm')}
        {c(
          'socketDiameter',
          'Socket opening diameter',
          'mm',
          `Maximum ${maxSocketDiameter(p)} mm for this bottom rim.`,
        )}
        <p className="control-note">
          The integrated bottom stays 5 mm thick, with three closed-bottom
          magnet recesses.
        </p>
      </section>
      <details className="editor-disclosure">
        <summary>Magnet recesses & underside</summary>
        <div className="base-diagram">
          <svg
            viewBox="0 0 240 210"
            role="img"
            aria-label="Underside: three circular recesses spaced 120 degrees apart in an annular rim"
          >
            <path d={baseOutline} fill="#d5c8ae" stroke="#6a6254" />
            <circle
              cx="120"
              cy="105"
              r={(p.socketDiameter / 2) * diagramScale}
              fill="#f7f5ef"
              stroke="#6a6254"
            />
            {[0, 120, 240].map((deg) => {
              const a = (deg * Math.PI) / 180,
                x = 120 + (baseMinRadius - 7) * Math.cos(a) * diagramScale,
                y = 105 + (baseMinRadius - 7) * Math.sin(a) * diagramScale;
              return (
                <circle
                  key={deg}
                  cx={x}
                  cy={y}
                  r={4.15 * diagramScale}
                  fill="#8d8068"
                  stroke="#514839"
                />
              );
            })}
          </svg>
          <span>UNDERSIDE · 120° SPACING</span>
        </div>
        <dl className="base-specs">
          <div>
            <dt>Socket opening</dt>
            <dd>Ø {p.socketDiameter.toFixed(1)} mm</dd>
          </div>
          <div>
            <dt>Rim thickness</dt>
            <dd>5.0 mm</dd>
          </div>
          <div>
            <dt>Magnet recesses</dt>
            <dd>Exactly 3</dd>
          </div>
          <div>
            <dt>Recess diameter</dt>
            <dd>8.3 mm</dd>
          </div>
          <div>
            <dt>Recess depth</dt>
            <dd>3.3 mm</dd>
          </div>
          <div>
            <dt>Closed backing</dt>
            <dd>1.7 mm</dd>
          </div>
        </dl>
        <button className="inspect-bottom" onClick={() => setView('bottom')}>
          <Magnet size={16} />
          Inspect underside
        </button>
        <p className="base-note">
          <Check size={15} />
          Closed-bottom recesses are part of the exported mesh.
        </p>
      </details>
    </>
  );
}
export function DiffuserControls() {
  const { project, edit, commit } = useLampProject(),
    p = project.shade,
    diffuser = project.diffuser,
    diffuserEnabled = project.diffuserEnabled;
  const editDiffuser = (patch: Partial<Project['diffuser']>) =>
      edit('diffuser', patch),
    setDiffuser = (next: Project['diffuser']) =>
      commit({ ...project, diffuser: next }),
    setDiffuserEnabled = (enabled: boolean) =>
      commit({ ...project, diffuserEnabled: enabled });
  const diffuserCheck = useMemo(() => diffuserFit(diffuser, p), [diffuser, p]),
    diffuserFile = usePreparedSTL(diffuser);
  return (
    <>
      <section>
        <div className="section-label">
          <h2>Separate inner diffuser</h2>
          <Switch
            aria-label="Enable inner diffuser"
            checked={diffuserEnabled}
            onCheckedChange={setDiffuserEnabled}
          />
        </div>
        <p className="base-description">
          A smooth cylinder with a socket flange. Print it separately, insert it
          through the top and rest it on the shade’s 5 mm bottom. The lamp
          holder’s retaining ring can secure the flange.
        </p>
        {(Object.keys(DIFFUSER_LIMITS) as (keyof typeof DIFFUSER_LIMITS)[]).map(
          (key) => (
            <DiffuserControl
              key={key}
              name={key}
              label={
                {
                  diameter: 'Diffuser diameter',
                  height: 'Diffuser height',
                  wall: 'Diffuser wall',
                  socketDiameter: 'Diffuser socket opening',
                  flangeWidth: 'Flange width',
                  flangeThickness: 'Flange thickness',
                }[key]
              }
              p={diffuser}
              onChange={editDiffuser}
            />
          ),
        )}
        <button
          className="inspect-bottom"
          onClick={() => {
            try {
              setDiffuser(matchDiffuser(diffuser, p));
              toast.success('Diffuser clearance and socket matched.');
            } catch (e) {
              toast.error(String(e));
            }
          }}
        >
          Fit diffuser to shade
        </button>
        <p className="control-note" role="status">
          {diffuserCheck.valid
            ? `Fit checked · minimum radial gap ${diffuserCheck.clearance.toFixed(1)} mm. Review bulb clearance separately.`
            : diffuserCheck.issues.join(' ')}
        </p>
        <p className="control-note">
          Use the preview toolbar to inspect both layers, the outer shade, or
          the inner diffuser.
        </p>
        <a
          className="export-button"
          role="button"
          aria-disabled={
            !diffuserCheck.valid || diffuserFile.status !== 'ready'
          }
          href={
            diffuserCheck.valid && diffuserFile.status === 'ready'
              ? diffuserFile.url
              : undefined
          }
          download={diffuserFile.filename}
          onClick={(e) => {
            if (!diffuserCheck.valid || diffuserFile.status !== 'ready') {
              e.preventDefault();
              toast.error(
                diffuserCheck.valid
                  ? diffuserFile.error || 'Preparing diffuser STL…'
                  : diffuserCheck.issues.join(' '),
              );
            }
          }}
        >
          <Download size={16} />
          Export inner diffuser STL
        </a>
        <p className="control-note">
          Downloads the diffuser as a separate part. Use normal printing for the
          flange and socket; inspect both parts in your slicer.
        </p>
      </section>
    </>
  );
}
