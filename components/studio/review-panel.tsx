'use client';
import { Check, AlertCircle, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Slider } from './slider';
import { Switch } from '@/components/ui/switch';
import PrintPanel from '@/components/print-panel';
import { matchShadeBase } from '@/lib/base-model.mjs';
import { emptyPreview } from '@/hooks/use-preview-model';
import { useFitChecks } from './fit-context';
import { useLampProject, type Part, type Stage } from './project-context';

export function FitSummary({
  navigate,
  compact = false,
}: {
  navigate: (stage: Stage, part?: Part) => void;
  compact?: boolean;
}) {
  const { project } = useLampProject(),
    checks = useFitChecks();
  const rows: {
    name: string;
    part: Part;
    ok: boolean;
    detail: string;
    pending?: boolean;
  }[] = [
    {
      name: 'Base mounting',
      part: 'base' as Part,
      ok: checks.mount,
      detail: checks.mount
        ? 'Outline & magnet positions match.'
        : 'Match the base outline to the shade.',
    },
    ...(project.base.e27Enabled
      ? [
          {
            name: 'Holder & bulb',
            part: 'base' as Part,
            ok:
              checks.holder.valid &&
              !checks.holderUpdating &&
              !checks.holderError,
            pending: checks.holderUpdating,
            detail: checks.holderUpdating
              ? 'Checking holder fit…'
              : checks.holderError ||
                (checks.holder.valid
                  ? `Estimated radial gap ${checks.holder.clearance.toFixed(1)} mm.`
                  : checks.holder.issues.join(' ')),
          },
        ]
      : []),
    ...(project.lidEnabled
      ? [
          {
            name: 'Lid fit',
            part: 'lid' as Part,
            ok: checks.lid,
            detail: checks.lid
              ? 'Matches the current shade.'
              : 'Shade changed. Match the lid again.',
          },
        ]
      : []),
    ...(project.diffuserEnabled
      ? [
          {
            name: 'Diffuser clearance',
            part: 'diffuser' as Part,
            ok:
              checks.diffuser.valid &&
              !checks.diffuserUpdating &&
              !checks.diffuserError,
            pending: checks.diffuserUpdating,
            detail: checks.diffuserUpdating
              ? 'Checking diffuser fit…'
              : checks.diffuserError ||
                (checks.diffuser.valid
                  ? `Minimum radial gap ${checks.diffuser.clearance.toFixed(1)} mm.`
                  : checks.diffuser.issues.join(' ')),
          },
        ]
      : []),
  ];
  return (
    <div className={`fit-summary ${compact ? 'compact' : ''}`}>
      {rows.map((row) => (
        <button
          key={row.name}
          className={`fit-row ${row.ok ? 'fit-ok' : 'fit-attention'}`}
          onClick={() => navigate('parts', row.part)}
        >
          {row.ok ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>
            <strong>{row.name}</strong>
            {!compact && <small>{row.detail}</small>}
          </span>
          <small>
            {row.pending ? 'Checking…' : row.ok ? 'Matched' : 'Review'}
          </small>
        </button>
      ))}
    </div>
  );
}

type Props = {
  shadeModel: ReturnType<typeof emptyPreview>;
  updating: boolean;
  gap: number;
  setGap: (value: number) => void;
  showHardware: boolean;
  setShowHardware: (value: boolean) => void;
  inspectHardware: boolean;
  setInspectHardware: (value: boolean) => void;
  navigate: (stage: Stage, part?: Part) => void;
};
export default function ReviewPanel({
  shadeModel,
  updating,
  gap,
  setGap,
  showHardware,
  setShowHardware,
  inspectHardware,
  setInspectHardware,
  navigate,
}: Props) {
  const { project, commit, edit } = useLampProject();
  return (
    <>
      <section>
        <div className="section-label">
          <h2>Connections & clearance</h2>
          <span>Geometry checks</span>
        </div>
        <FitSummary navigate={navigate} />
        <p className="control-note">
          Each check covers its named connection. Manufacturing tolerances,
          thermal suitability, and electrical safety need separate review.
        </p>
        <button
          className="inspect-bottom match-shade"
          onClick={() => {
            try {
              if (
                commit({
                  ...project,
                  base: matchShadeBase(project.base, project.shade),
                })
              )
                toast.success('Base outline and magnet positions matched.');
            } catch (e) {
              toast.error(String(e));
            }
          }}
        >
          <Link2 size={16} />
          Match base to shade
        </button>
      </section>
      <section className="control-section">
        <h2>Inspect the assembly</h2>
        <dl className="base-specs">
          <div>
            <dt>Shade height</dt>
            <dd>{project.shade.height} mm</dd>
          </div>
          <div>
            <dt>Base height</dt>
            <dd>{project.base.height} mm</dd>
          </div>
          <div>
            <dt>Assembled height</dt>
            <dd>
              {project.shade.height +
                project.base.height +
                (project.lidEnabled
                  ? project.lid.height - project.lid.grooveDepth
                  : 0)}{' '}
              mm
            </dd>
          </div>
        </dl>
        <div className="control">
          <div className="control-head">
            <label htmlFor="assembly-gap">Exploded spacing</label>
            <span>{gap} mm</span>
          </div>
          <Slider
            id="assembly-gap"
            aria-label="Exploded preview spacing"
            className="precision-slider"
            min={0}
            max={100}
            value={[gap]}
            onValueChange={(value) => setGap(value[0])}
          />
          <p className="control-note">
            Preview only. Exported geometry stays unchanged.
          </p>
        </div>
        {project.base.e27Enabled && (
          <>
            <div className="control-head">
              <label htmlFor="show-hardware">Holder & bulb envelope</label>
              <Switch
                id="show-hardware"
                checked={showHardware}
                onCheckedChange={(value) => {
                  setShowHardware(value);
                  if (!value) setInspectHardware(false);
                }}
              />
            </div>
            {showHardware && (
              <div className="control-head">
                <label htmlFor="isolate-hardware">Isolate hardware</label>
                <Switch
                  id="isolate-hardware"
                  checked={inspectHardware}
                  onCheckedChange={setInspectHardware}
                />
              </div>
            )}
            <p className="control-note">
              Generic dimensions from your holder settings. Hardware is excluded
              from all STL files.
            </p>
          </>
        )}
        <div className="project-actions">
          <button onClick={() => navigate('parts', 'lid')}>Edit lid</button>
          <button onClick={() => navigate('parts', 'diffuser')}>
            Edit diffuser
          </button>
        </div>
      </section>
      <details className="editor-disclosure" open>
        <summary>Shade printer checks</summary>
        <PrintPanel
          model={shadeModel}
          updating={updating}
          onChange={(patch) => edit('shade', patch)}
        />
      </details>
      <p className="control-note">
        Printer fit and overhang tools above apply to the shade. Review the
        base, lid, and diffuser in your slicer.
      </p>
    </>
  );
}
