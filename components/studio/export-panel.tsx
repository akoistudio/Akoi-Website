'use client';
import { Download, FileJson, Check, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePreparedSTL } from '@/hooks/use-prepared-stl';
import { diffuserFit } from '@/lib/diffuser-model.mjs';
import { useMemo } from 'react';
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
  const file = usePreparedSTL(params);
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
      <a
        className="export-button"
        role="button"
        href={valid && file.status === 'ready' ? file.url : undefined}
        download={file.filename}
        aria-disabled={!valid || file.status !== 'ready'}
        onClick={(event) => {
          if (!valid || file.status !== 'ready') {
            event.preventDefault();
            toast.error(
              !valid ? reason : file.error || 'The STL is still preparing.',
            );
          } else toast.success(`${partNames[part]} STL download requested.`);
        }}
      >
        {file.status === 'preparing' ? (
          <LoaderCircle size={16} className="loading-icon" />
        ) : (
          <Download size={16} />
        )}
        {file.status === 'preparing'
          ? 'Preparing…'
          : `Download ${partNames[part].toLowerCase()} STL`}
      </a>
      {file.error && (
        <p role="alert" className="design-error">
          {file.error}
        </p>
      )}
      {!valid && <p className="control-note">{reason}</p>}
    </div>
  );
}
export default function ExportPanel() {
  const { project, active } = useLampProject();
  const fit = useMemo(
    () => diffuserFit(project.diffuser, project.shade),
    [project.diffuser, project.shade],
  );
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
        valid={fit.valid}
        reason={fit.issues.join(' ')}
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
