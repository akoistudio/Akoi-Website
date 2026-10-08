'use client';
import { Download, FileJson, Check, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePreparedSTL } from '@/hooks/use-prepared-stl';
import { useFitChecks } from './fit-context';
import { useLampProject, type Part, type Project } from './project-context';
import { partNames } from './catalog';

export function downloadProject(project: Project, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/[^a-z0-9_-]/gi, '-') || 'akoi-design'}.akoi.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function STLDownloadButton({
  params,
  label,
  valid = true,
  reason = '',
}: {
  params: Project[Part];
  label: string;
  valid?: boolean;
  reason?: string;
}) {
  const file = usePreparedSTL(params);
  return (
    <>
      <button
        className="export-button"
        disabled={!valid || file.status === 'preparing'}
        onClick={async () => {
          try {
            await file.download();
            toast.success('STL download requested.');
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;
            toast.error(
              error instanceof Error
                ? error.message
                : 'Could not export this part.',
            );
          }
        }}
      >
        {file.status === 'preparing' ? (
          <LoaderCircle size={16} className="loading-icon" />
        ) : (
          <Download size={16} />
        )}
        {file.status === 'preparing' ? 'Preparing…' : label}
      </button>
      {file.error && (
        <p role="alert" className="design-error">
          {file.error}
        </p>
      )}
      {!valid && reason && <p className="control-note">{reason}</p>}
    </>
  );
}
function STLDownload({
  part,
  params,
  included,
  valid = true,
  reason = '',
}: {
  part: Part;
  params: Project[Part];
  included: boolean;
  valid?: boolean;
  reason?: string;
}) {
  return (
    <div className="export-card">
      <div className="export-card-head">
        <strong>{partNames[part]}</strong>
        <span>{included ? 'Included in lamp' : 'Optional part'}</span>
      </div>
      <p>
        {part === 'shade'
          ? 'Outer shade'
          : part === 'base'
            ? 'Separate base'
            : part === 'lid'
              ? 'Slide-on lid'
              : 'Smooth inner diffuser'}{' '}
        · {params.height} mm high
      </p>
      <STLDownloadButton
        params={params}
        label={`Download ${partNames[part].toLowerCase()} STL`}
        valid={valid}
        reason={reason}
      />
    </div>
  );
}
export default function ExportPanel() {
  const { project, active } = useLampProject();
  const { diffuser: fit, diffuserUpdating, diffuserError } = useFitChecks();
  return (
    <>
      <div className="export-intro">
        <Check size={17} />
        <span>Separate parts, ready for your slicer.</span>
      </div>
      <p className="control-note section-intro">
        STLs contain mesh geometry in millimeters. Preview colors and reference
        hardware are excluded. Review sliced toolpaths before printing.
      </p>
      <STLDownload part="shade" params={project.shade} included />
      <STLDownload part="base" params={project.base} included />
      <STLDownload
        part="lid"
        params={project.lid}
        included={project.lidEnabled}
      />
      <STLDownload
        part="diffuser"
        params={project.diffuser}
        included={project.diffuserEnabled}
        valid={fit.valid && !diffuserUpdating && !diffuserError}
        reason={
          diffuserUpdating
            ? 'Checking diffuser fit…'
            : diffuserError || fit.issues.join(' ')
        }
      />
      <section className="control-section">
        <h2>Keep an editable copy</h2>
        <p className="control-note section-intro">
          A project keeps all parameters, parts, and finishes. STL files cannot
          restore the editing controls.
        </p>
        <button
          className="inspect-bottom"
          onClick={() => downloadProject(project, active?.name || 'My lamp')}
        >
          <FileJson size={17} />
          Download .akoi.json project
        </button>
      </section>
    </>
  );
}
