'use client';
import { useState, useEffect } from 'react';
import { Check, Magnet, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Slider } from './slider';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLampProject, type Stage, type Part } from './project-context';
import { e27Opening } from '@/lib/e27-base.mjs';
import { useFitChecks } from './fit-context';
import {
  BASE_DEFAULTS,
  BASE_SHAPES,
  BASE_PROFILES,
  BASE_TEXTURES,
  BASE_LIMITS,
  baseSocketMax,
  matchShadeBase,
} from '@/lib/base-model.mjs';
type Params = typeof BASE_DEFAULTS;
type Key = keyof typeof BASE_LIMITS;
const label = (s: string) =>
  s === 'clay'
    ? 'Hand-worked clay'
    : s === 'fuzzy'
      ? 'Brushed / fuzzy'
      : s === 'rounded-square'
        ? 'Rounded square'
        : s[0].toUpperCase() + s.slice(1);
function BaseControl({
  name,
  title,
  p,
  onChange,
  note,
  unit = 'mm',
}: {
  name: Key;
  title: string;
  p: Params;
  onChange: (patch: Partial<Params>) => void;
  note?: string;
  unit?: string;
}) {
  const [lo, hi, step] = BASE_LIMITS[name],
    min =
      name === 'diameter'
        ? p.topDiameter
        : name === 'socketDiameter'
          ? 10
          : name === 'depthRatio'
            ? Math.max(lo, Math.ceil((38 / p.topDiameter) * 100))
            : lo,
    max =
      name === 'e27Depth'
        ? Math.max(12, p.height - p.e27Deck - p.e27CableHeight - 2)
        : name === 'socketDiameter'
          ? baseSocketMax(p)
          : hi;
  const value = p[name];
  const [draft, setDraft] = useState(String(value));
  // Synchronize numerical drafts after slider edits, templates, and undo.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const value = Number(draft);
    if (
      draft.trim() &&
      Number.isFinite(value) &&
      value >= min &&
      value <= max &&
      (step !== 1 || Number.isInteger(value))
    )
      onChange({ [name]: value });
    else {
      setDraft(String(p[name]));
      toast.error(`${title}: enter ${min}–${max} ${unit}.`);
    }
  };
  return (
    <div className="control">
      <div className="control-head">
        <label htmlFor={`base-${name}`}>{title}</label>
        <div className="number-wrap">
          <input
            id={`base-${name}`}
            aria-label={title}
            type="number"
            min={min}
            max={max}
            step={step}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
          />
          <span>{unit}</span>
        </div>
      </div>
      <Slider
        aria-label={`${title} slider`}
        className="precision-slider"
        min={min}
        max={max}
        step={step}
        value={[p[name]]}
        onValueChange={(v) => onChange({ [name]: v[0] })}
      />
      {note && <p className="control-note">{note}</p>}
    </div>
  );
}
function BaseGlyph({ shape }: { shape: string }) {
  return (
    <svg viewBox="0 0 64 52" aria-hidden="true">
      {shape === 'circle' ? (
        <circle cx="32" cy="26" r="18" />
      ) : shape === 'oval' ? (
        <ellipse cx="32" cy="26" rx="23" ry="15" />
      ) : shape === 'hexagon' ? (
        <polygon points="12,26 22,9 42,9 52,26 42,43 22,43" />
      ) : (
        <rect
          x="13"
          y="7"
          width="38"
          height="38"
          rx={shape === 'rounded-square' ? 9 : 0}
        />
      )}
    </svg>
  );
}

export default function BaseControls({
  section,
  setView,
  navigate,
}: {
  section: 'form' | 'surface' | 'mount';
  setView: (view: string) => void;
  navigate: (stage: Stage, part: Part) => void;
}) {
  const { project, edit, commit } = useLampProject(),
    p = project.base;
  const change = (patch: Partial<Params>) => edit('base', patch);
  const match = () => {
    try {
      const next = matchShadeBase(p, project.shade);
      if (commit({ ...project, base: next }))
        toast.success(
          'Base outline and magnets matched. Holder opening remains independent.',
        );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not match the base.');
    }
  };
  const { holder: fit, holderUpdating, holderError } = useFitChecks();
  const c = (name: Key, title: string, note?: string, unit = 'mm') => (
    <BaseControl
      key={name}
      name={name}
      title={title}
      p={p}
      onChange={change}
      note={note}
      unit={unit}
    />
  );
  const toggle = (
    id: string,
    title: string,
    checked: boolean,
    action: (v: boolean) => void,
    note: string,
  ) => (
    <div className="top-lock-control">
      <div className="control-head">
        <label htmlFor={id}>{title}</label>
        <Switch id={id} checked={checked} onCheckedChange={action} />
      </div>
      <p className="control-note">{note}</p>
    </div>
  );
  if (section === 'form')
    return (
      <>
        <section>
          <div className="section-label">
            <h2>Base shape</h2>
            <span>5 forms</span>
          </div>
          <RadioGroup
            aria-label="Base shape"
            className="shape-grid base-shape-grid"
            value={p.shape}
            onValueChange={(shape) =>
              change({
                shape,
                e27Enabled: shape === 'circle' ? p.e27Enabled : false,
              })
            }
          >
            {BASE_SHAPES.map((shape) => (
              <label
                key={shape}
                className={`shape-card ${p.shape === shape ? 'selected' : ''}`}
              >
                <RadioGroupItem className="choice-radio" value={shape} />
                <BaseGlyph shape={shape} />
                <span>{label(shape)}</span>
                {p.shape === shape && (
                  <Check className="selected-check" size={11} />
                )}
              </label>
            ))}
          </RadioGroup>
        </section>
        <section className="control-section">
          <h2>Profile</h2>
          <RadioGroup
            aria-label="Base profile"
            value={p.profile}
            onValueChange={(profile) => change({ profile })}
            className="base-profile-list"
          >
            {BASE_PROFILES.map((profile) => (
              <label
                key={profile}
                className={`texture-card ${p.profile === profile ? 'selected' : ''}`}
              >
                <RadioGroupItem value={profile} className="choice-radio" />
                <span>{label(profile)}</span>
                <small>
                  {profile === 'straight'
                    ? 'Vertical sides'
                    : profile === 'tapered'
                      ? 'Wide foot, slim top'
                      : 'Curved shoulder'}
                </small>
              </label>
            ))}
          </RadioGroup>
        </section>
        <section className="control-section">
          <h2>Dimensions</h2>
          {c('height', 'Base height')}
          {c(
            'topDiameter',
            'Mounting width',
            'The top outline that meets the shade.',
          )}
          {p.profile !== 'straight' &&
            c(
              'diameter',
              'Foot width',
              'At least as wide as the mounting surface.',
            )}
          {!p.e27Enabled && c('depthRatio', 'Depth / width', undefined, '%')}
        </section>
      </>
    );
  if (section === 'surface')
    return (
      <>
        <section>
          <div className="section-label">
            <h2>Base texture</h2>
            <span>Actual geometry</span>
          </div>
          <RadioGroup
            aria-label="Base texture"
            className="texture-list"
            value={p.texture}
            onValueChange={(texture) => change({ texture })}
          >
            {BASE_TEXTURES.map((texture) => (
              <label
                key={texture}
                className={`texture-card ${p.texture === texture ? 'selected' : ''}`}
              >
                <RadioGroupItem value={texture} className="choice-radio" />
                <span
                  className={`texture-sample texture-${texture === 'wave' ? 'scalloped' : texture}`}
                />
                <span>{label(texture)}</span>
                {p.texture === texture && <Check size={15} />}
              </label>
            ))}
          </RadioGroup>
          {p.texture === 'clay' && (
            <div className="texture-controls">
              <p className="mesh-note">
                Shallow clay impressions built into the STL. Mounting surfaces
                and magnet recesses stay smooth.
              </p>
              {c('clayDepth', 'Mark depth')}
              {c('claySize', 'Mark size')}
              {c('claySpacing', 'Mark spacing')}
              {c('clayStretch', 'Mark length', undefined, '×')}
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
                Irregular brushed grain built into the STL. Top and bottom
                mounting surfaces stay smooth.
              </p>
              {c('fuzzyDepth', 'Fuzz depth')}
              {c(
                'fuzzySpacing',
                'Grain spacing',
                'Smaller spacing makes finer, denser grain.',
              )}
              {c(
                'fuzzyStretch',
                'Brush length',
                '1 gives compact fuzz; higher values stretch the grain vertically.',
                '×',
              )}
              <button
                className="inspect-bottom"
                onClick={() => change({ fuzzySeed: (p.fuzzySeed + 1) % 10000 })}
              >
                New grain pattern
              </button>
            </div>
          )}
          {!['smooth', 'fuzzy', 'clay'].includes(p.texture) && (
            <div className="texture-controls">
              {c('textureDepth', 'Texture depth')}
              {c('textureCount', 'Texture repeats', undefined, '')}
              {c('twist', 'Texture twist', undefined, '°')}
            </div>
          )}
          <p className="mesh-note">
            The mounting surface stays flat so the shade sits evenly.
          </p>
        </section>
      </>
    );
  return (
    <>
      <section>
        <div className="section-label">
          <h2>Pair with a shade</h2>
          <span>Mounting surface</span>
        </div>
        <p className="base-description">
          Copy the current shade’s bottom outline and align its three magnet
          positions.
        </p>
        <button className="inspect-bottom match-shade" onClick={match}>
          <Link2 size={16} />
          Match current shade
        </button>
        <p className="control-note">
          Lamp-holder opening is independent. Your complete lamp stays available
          throughout the workflow.
        </p>
      </section>
      <section className="control-section">
        <h2>{p.e27Enabled ? 'Top bulb passage' : 'Lamp-holder opening'}</h2>
        {toggle(
          'base-opening',
          'Center opening',
          p.socketDiameter > 0,
          (v) =>
            change({
              socketDiameter: v ? Math.min(72, baseSocketMax(p)) : 0,
              ...(!v ? { e27Enabled: false } : {}),
            }),
          p.e27Enabled
            ? 'Opening through the top rim; the E27 clamping aperture is inside the stem.'
            : 'Open through the base for your lamp holder, or turn off for a closed center.',
        )}
        {p.socketDiameter > 0 &&
          c(
            'socketDiameter',
            p.e27Enabled ? 'Top passage diameter' : 'Holder opening diameter',
            `Maximum ${baseSocketMax(p)} mm, with mounting rim reserved.`,
          )}
      </section>
      <section className="control-section">
        <h2>E27 holder mount</h2>
        {toggle(
          'e27-enabled',
          'Integrated E27 mount',
          p.e27Enabled,
          (v) =>
            change(
              v
                ? {
                    e27Enabled: true,
                    shape: 'circle',
                    depthRatio: 100,
                    height: Math.max(100, p.height),
                    e27Depth: Math.min(
                      65,
                      Math.max(100, p.height) -
                        p.e27Deck -
                        p.e27CableHeight -
                        2,
                    ),
                    socketDiameter: Math.min(
                      Math.max(64, p.socketDiameter),
                      baseSocketMax({ ...p, depthRatio: 100 }),
                    ),
                  }
                : { e27Enabled: false },
            ),
          'Hollow circular stem with an internal clamping deck and underside cable notch. Use a purchased insulated holder with its matching retaining rings.',
        )}
        {p.e27Enabled && (
          <>
            <p className="control-note">
              Insert the holder through the open underside, clamp it to the
              internal deck using its own rings, then install the LED bulb
              through the top. The printed part contains no electrical contacts
              or E27 bulb thread.
            </p>
            {c(
              'e27Depth',
              'Mount depth below top',
              'Lowering the holder can illuminate more of the stem.',
            )}
            {c('e27Barrel', 'Measured holder barrel diameter')}
            {c('e27Tolerance', 'Radial fit allowance')}
            {c('e27Wall', 'Stem wall thickness')}
            <details className="editor-disclosure">
              <summary>Holder rings, deck & cable</summary>
              {c('e27Ring', 'Retaining-ring outer diameter')}
              {c(
                'e27Deck',
                'Clamping deck thickness',
                'Match the usable threaded length of your holder. The top magnet rim remains 5 mm.',
              )}
              {c('e27CableWidth', 'Cable notch width')}
              {c(
                'e27CableHeight',
                'Cable notch height',
                'Not a strain relief. Keep the purchased cord set’s approved cable clamp.',
              )}
            </details>
            <details className="editor-disclosure">
              <summary>Bulb size & fit</summary>
              {c('e27HolderHeight', 'Holder height above deck')}
              {c('e27BulbDiameter', 'Bulb maximum diameter')}
              {c('e27BulbHeight', 'Bulb height above holder')}
              {c(
                'e27Clearance',
                'Target radial clearance',
                'A geometric target, not a validated thermal clearance.',
              )}
            </details>
            <dl className="base-specs">
              <div>
                <dt>Clamping aperture</dt>
                <dd>Ø {e27Opening(p).toFixed(1)} mm</dd>
              </div>
              <div>
                <dt>Mount height from foot</dt>
                <dd>{p.height - p.e27Depth} mm</dd>
              </div>
            </dl>
            <p className="control-note" role="status">
              {holderUpdating
                ? 'Checking holder fit…'
                : holderError ||
                  (fit.valid
                    ? `Geometry fit passes · minimum estimated gap ${fit.clearance.toFixed(1)} mm.`
                    : fit.issues.join(' '))}
            </p>
            <button
              className="inspect-bottom"
              onClick={() => navigate('review', 'base')}
            >
              Inspect holder & bulb
            </button>
            <p className="base-note">
              Use an approved, fully insulated E27 cord set and LED bulb. Have
              any mains wiring assembled by a qualified electrician. Confirm
              physical fit, ventilation and operating temperature before use;
              these dimensions do not certify a finished lamp.
            </p>
            <p className="control-note">
              Print as a normal solid-wall part. The internal deck and cap flare
              may need supports; inspect them in your slicer. Not compatible
              with spiral vase mode.
            </p>
          </>
        )}
      </section>
      <section className="control-section">
        <h2>Magnets</h2>
        {toggle(
          'base-magnets',
          'Three magnet recesses',
          p.magnetRecesses,
          (v) => change({ magnetRecesses: v }),
          'Top-facing closed-bottom pockets. Match the shade, then install magnets with opposite poles facing.',
        )}
        <dl className="base-specs">
          <div>
            <dt>Recess diameter</dt>
            <dd>8.3 mm</dd>
          </div>
          <div>
            <dt>Recess depth</dt>
            <dd>3.3 mm</dd>
          </div>
          <div>
            <dt>Spacing</dt>
            <dd>120°</dd>
          </div>
          <div>
            <dt>Solid backing</dt>
            <dd>{(p.e27Enabled ? 1.7 : p.height - 3.3).toFixed(1)} mm</dd>
          </div>
        </dl>
        <button className="inspect-bottom" onClick={() => setView('top')}>
          <Magnet size={16} />
          Inspect mounting surface
        </button>
      </section>
    </>
  );
}
