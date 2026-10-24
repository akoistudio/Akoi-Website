'use client';
import { useState, useEffect } from 'react';
import { Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Slider } from './slider';
import { useLampProject, type Project } from './project-context';
import { LID_LIMITS, matchShadeLid } from '@/lib/lid-model.mjs';
function LidControl({
  name,
  label,
  note,
  p,
  change,
}: {
  name: keyof typeof LID_LIMITS;
  label: string;
  note: string;
  p: Project['lid'];
  change: (patch: Partial<Project['lid']>) => void;
}) {
  const [min, max, step] = LID_LIMITS[name],
    value = p[name],
    [draft, setDraft] = useState(String(value));
  // Synchronize numerical drafts after slider edits, matching, and undo.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Number(draft);
    if (draft.trim() && Number.isFinite(n) && n >= min && n <= max)
      change({ [name]: n });
    else toast.error(`${label}: enter ${min}–${max} mm.`);
    setDraft(String(p[name]));
  };
  return (
    <div className="control">
      <div className="control-head">
        <label htmlFor={`lid-${name}`}>{label}</label>
        <div className="number-wrap">
          <input
            id={`lid-${name}`}
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
            }}
          />
          <span>mm</span>
        </div>
      </div>
      <Slider
        className="precision-slider"
        aria-label={`${label} slider`}
        min={min}
        max={max}
        step={step}
        value={[p[name]]}
        onValueChange={(v) => change({ [name]: v[0] })}
      />
      <p className="control-note">{note}</p>
    </div>
  );
}

export default function LidControls({
  setView,
}: {
  setView: (view: string) => void;
}) {
  const { project, edit, commit, ready } = useLampProject(),
    p = project.lid;
  const change = (patch: Partial<Project['lid']>) => edit('lid', patch);
  const match = () => {
    try {
      const next = matchShadeLid(p, project.shade);
      if (commit({ ...project, lid: next, lidEnabled: true })) {
        setView('perspective');
        toast.success('Lid matched and included in the lamp.');
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Could not match the shade.',
      );
    }
  };
  const control = (
    key: keyof typeof LID_LIMITS,
    label: string,
    note: string,
  ) => (
    <LidControl
      key={key}
      name={key}
      label={label}
      note={note}
      p={p}
      change={change}
    />
  );
  return (
    <>
      <div className="section-label">
        <h2>Include lid</h2>
        <Switch
          aria-label="Include lid in lamp"
          checked={project.lidEnabled}
          onCheckedChange={(value) => commit({ ...project, lidEnabled: value })}
        />
      </div>
      <section>
        <div className="section-label">
          <h2>Match the shade</h2>
          <span>Continuous groove</span>
        </div>
        <p className="base-description">
          A closed-top lid with an underside dado all around its perimeter. The
          shade’s rim slides into this groove from below.
        </p>
        <button
          className="inspect-bottom match-shade"
          disabled={!ready}
          onClick={match}
        >
          <Link2 size={16} />
          Match current shade
        </button>
        <p className="control-note">
          Fits the saved top outline, wall and insertion depth—including taper.
          If you change the shade, match again. Open textures need a solid
          smooth top collar.
        </p>
        <dl className="base-specs">
          <div>
            <dt>Matched form</dt>
            <dd>{p.source.shape}</dd>
          </div>
          <div>
            <dt>Nominal top width</dt>
            <dd>{p.source.topDiameter} mm</dd>
          </div>
          <div>
            <dt>Closed roof above groove</dt>
            <dd>{(p.height - p.grooveDepth).toFixed(1)} mm</dd>
          </div>
        </dl>
      </section>
      <section className="control-section">
        <h2>Groove & fit</h2>
        {control(
          'clearance',
          'Fit clearance per side',
          'Space on both sides of the shade wall. Tune with a small test print for your printer.',
        )}
        {control(
          'grooveDepth',
          'Insertion / groove depth',
          'How far the lid seats over the top rim.',
        )}
        {control(
          'lipWidth',
          'Outer lip thickness',
          'Material outside the groove.',
        )}
        {control(
          'overhang',
          'Extra outer overhang',
          'Additional width outside the lip.',
        )}
      </section>
      <section className="control-section">
        <h2>Lid dimensions</h2>
        {control(
          'height',
          'Lid thickness',
          'Must leave at least 1.2 mm of closed roof above the groove.',
        )}
        {control(
          'ventDiameter',
          'Center opening diameter',
          '0 gives a closed center. Optional opening through the center; the perimeter groove stays blind.',
        )}
        <button className="inspect-bottom" onClick={() => setView('bottom')}>
          Inspect underside groove
        </button>
      </section>
      <p className="control-note">
        Print with the flat top on the build plate and the groove facing up. STL
        remains in modeling orientation; rotate it in your slicer.
      </p>
    </>
  );
}
