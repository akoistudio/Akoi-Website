'use client';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Undo2,
  Redo2,
  RotateCcw,
  Download,
  Layers3,
  Box,
  Check,
  LockKeyhole,
  ChevronRight,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import ModelPreview from '@/components/model-preview';
import DesignManager from '@/components/design-manager';
import {
  generateModel,
  DEFAULTS,
  BASE,
  SHAPES,
  TEXTURES,
  LIMITS,
} from '@/lib/model.mjs';
import { generateBase, BASE_DEFAULTS } from '@/lib/base-model.mjs';
import { generateLid } from '@/lib/lid-model.mjs';
import { generateDiffuser, layeredShade } from '@/lib/diffuser-model.mjs';
import { assembleLamp } from '@/lib/assembly.mjs';
import { usePreparedSTL } from '@/hooks/use-prepared-stl';
import {
  useLampProject,
  type Part,
  type Stage,
  type Project,
} from './project-context';
import { stages, partNames, displayName } from './catalog';
import { FinishPicker } from './pickers';
import ShadeControls from './shade-controls';
import BaseControls from './base-controls';
import LidControls from './lid-controls';
import StartPanel from './start-panel';
import ReviewPanel, { useFitChecks } from './review-panel';
import ExportPanel from './export-panel';

const stageParts: Record<Stage, Part[]> = {
  start: [],
  form: ['shade', 'base'],
  surface: ['shade', 'base', 'lid', 'diffuser'],
  parts: ['shade', 'base', 'lid', 'diffuser'],
  review: [],
  export: [],
};
const previewResolution = { segments: 192, layers: 80, pocketSegments: 64 };
export default function StudioWorkspace({
  initialPart = 'shade',
  initialStage = 'start',
}: {
  initialPart?: Part;
  initialStage?: Stage;
}) {
  const {
    project,
    ready,
    active,
    dirty,
    saved,
    edit,
    canUndo,
    canRedo,
    undo,
    redo,
    begin,
    end,
  } = useLampProject();
  const [stage, setStage] = useState<Stage>(initialStage),
    [part, setPart] = useState<Part>(initialPart);
  const [previewMode, setPreviewMode] = useState<'lamp' | 'part'>('lamp'),
    [view, setView] = useState('perspective'),
    [wireframe, setWireframe] = useState(false);
  const [gap, setGap] = useState(0),
    [showHardware, setShowHardware] = useState(false),
    [inspectHardware, setInspectHardware] = useState(false),
    [layerView, setLayerView] = useState('both');
  const [openRequest, setOpenRequest] = useState(0);
  const scroll = useRef<HTMLDivElement>(null),
    inspectorHeading = useRef<HTMLHeadingElement>(null);
  const currentStage = stages.find((value) => value.id === stage)!;
  const navigate = useCallback(
    (next: Stage, nextPart?: Part) => {
      end();
      setStage(next);
      if (nextPart) setPart(nextPart);
      else if (stageParts[next].length && !stageParts[next].includes(part))
        setPart('shade');
      if (next === 'review') setPreviewMode('lamp');
    },
    [end, part],
  );
  useEffect(() => {
    scroll.current?.scrollTo({ top: 0 });
  }, [stage, part]);
  const shadeModel = useMemo(
    () =>
      project.shade.texture === 'woven'
        ? generateModel(project.shade, previewResolution)
        : generateModel(project.shade),
    [project.shade],
  );
  const assembly = useMemo(
    () => assembleLamp(project, gap, previewResolution, showHardware),
    [project, gap, showHardware],
  );
  const focused = useMemo(
    () =>
      previewMode !== 'part'
        ? null
        : part === 'base'
          ? generateBase(project.base)
          : part === 'lid'
            ? generateLid(project.lid)
            : part === 'diffuser'
              ? generateDiffuser(project.diffuser)
              : project.diffuserEnabled
                ? layeredShade(
                    shadeModel,
                    project.diffuser,
                    layerView,
                    project.finishes.shade,
                    project.finishes.diffuser,
                  )
                : shadeModel,
    [
      previewMode,
      part,
      project.base,
      project.lid,
      project.diffuser,
      project.diffuserEnabled,
      project.finishes.shade,
      project.finishes.diffuser,
      shadeModel,
      layerView,
    ],
  );
  const visibleModel = useMemo(
    () =>
      previewMode === 'part' && focused
        ? focused
        : inspectHardware && showHardware && assembly.parts.hardware
          ? {
              ...assembly,
              positions: assembly.parts.hardware.positions,
              indices: assembly.parts.hardware.indices,
              colors: undefined,
            }
          : assembly,
    [previewMode, focused, inspectHardware, showHardware, assembly],
  );
  const bounds = useMemo(() => {
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity],
      vertices = visibleModel.positions;
    for (let i = 0; i < vertices.length; i += 3)
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], vertices[i + axis]);
        max[axis] = Math.max(max[axis], vertices[i + axis]);
      }
    return max.map((n, i) => n - min[i]);
  }, [visibleModel]);
  const checks = useFitChecks();
  const attention =
    !checks.mount ||
    (project.lidEnabled && !checks.lid) ||
    (project.diffuserEnabled && !checks.diffuser.valid) ||
    (project.base.e27Enabled && !checks.holder.valid);
  const included =
    2 + Number(project.lidEnabled) + Number(project.diffuserEnabled);
  const shadeFile = usePreparedSTL(project.shade),
    fileRef = useRef(shadeFile);
  const current = useRef(project.shade);
  useEffect(() => {
    fileRef.current = shadeFile;
    current.current = project.shade;
  }, [shadeFile, project.shade]);
  const change = useCallback(
    (patch: Partial<Project['shade']>) => edit('shade', patch),
    [edit],
  );
  const prepareDownload = useCallback(() => {
    const file = fileRef.current;
    if (file.status !== 'ready')
      throw new Error(file.error || 'The STL is still preparing.');
    return {
      status: 'ready',
      filename: file.filename,
      downloadUrl: file.url,
      bottom: BASE,
    };
  }, []);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => unknown;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tools = [
      {
        name: 'read_model',
        description:
          'Read the current shade parameters and fixed mounting specifications.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: () => ({
          parameters: current.current,
          bottom: { ...BASE, socketDiameter: current.current.socketDiameter },
        }),
      },
      {
        name: 'configure_model',
        description:
          'Update shade parameters in the complete-lamp workspace. Fixed magnet dimensions remain unchanged.',
        inputSchema: {
          type: 'object',
          properties: {
            parameters: {
              type: 'object',
              properties: {
                shape: { enum: SHAPES },
                texture: { enum: TEXTURES },
                lockTop: { type: 'boolean' },
                weaveOpen: { type: 'boolean' },
                panelRibs: { type: 'boolean' },
                ...Object.fromEntries(
                  Object.entries(LIMITS).map(
                    ([key, [minimum, maximum, step]]) => [
                      key,
                      {
                        type: step === 1 ? 'integer' : 'number',
                        minimum,
                        maximum,
                      },
                    ],
                  ),
                ),
              },
              additionalProperties: false,
            },
          },
          required: ['parameters'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: async (input: { parameters?: Partial<Project['shade']> }) => {
          if (
            !input?.parameters ||
            Object.keys(input).some((key) => key !== 'parameters')
          )
            throw new Error('Provide a parameters object.');
          change(input.parameters);
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
          return { parameters: current.current, bottom: BASE };
        },
      },
      {
        name: 'prepare_stl_download',
        description:
          'Return the existing local shade STL download, in millimeters with three blind magnet recesses.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: prepareDownload,
      },
    ];
    for (const tool of tools) {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    }
    return () => lifecycle.abort();
  }, [change, prepareDownload]);
  const inspect = (nextView: string) => {
    setPreviewMode('part');
    setView(nextView);
  };
  const visibleParts = stageParts[stage];
  const reset = () => {
    edit(part, part === 'shade' ? { ...DEFAULTS } : { ...BASE_DEFAULTS });
    toast.success(`${partNames[part]} reset. Undo restores your edits.`);
  };
  const showFinish = stage === 'surface';
  const nextStage = stages[stages.findIndex((value) => value.id === stage) + 1];
  const previewLabel =
    previewMode === 'lamp'
      ? inspectHardware && showHardware
        ? 'Holder & bulb'
        : gap
          ? 'Exploded lamp'
          : 'Your lamp'
      : partNames[part];

  return (
    <main className="studio lamp-workspace">
      <header className="topbar">
        <div className="brand">
          AKŌI<span>FORM STUDIO</span>
        </div>
        <div className="project-identity">
          <strong title={active?.name || 'Untitled lamp'}>
            {active?.name || 'Untitled lamp'}
          </strong>
          <span role="status">
            {!ready
              ? 'Opening workspace…'
              : dirty
                ? saved
                  ? 'Unsaved changes'
                  : 'Not saved'
                : 'All changes saved'}
          </span>
        </div>
        <div className="header-actions">
          <div className="history">
            <button
              aria-label="Undo design change"
              title="Undo · Ctrl/Cmd Z"
              disabled={!canUndo}
              onClick={undo}
            >
              <Undo2 size={18} />
            </button>
            <button
              aria-label="Redo design change"
              title="Redo · Ctrl/Cmd Shift Z"
              disabled={!canRedo}
              onClick={redo}
            >
              <Redo2 size={18} />
            </button>
          </div>
          <DesignManager
            openRequest={openRequest}
            onLoad={() => {
              navigate('form', 'shade');
              setView('perspective');
              setPreviewMode('lamp');
              setGap(0);
            }}
          />
          <button
            className={`export-button header-export ${stage === 'export' ? 'current' : ''}`}
            onClick={() => navigate('export')}
          >
            <Download size={17} />
            <span>Export</span>
          </button>
        </div>
      </header>
      <nav className="workflow-nav" aria-label="Lamp design workflow">
        {stages.map((item, index) => (
          <button
            key={item.id}
            aria-current={stage === item.id ? 'step' : undefined}
            className={stage === item.id ? 'active' : ''}
            onClick={() => navigate(item.id)}
          >
            <span className="step-number">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span>{item.name}</span>
          </button>
        ))}
        <span className="workflow-caption">One lamp. Every part.</span>
      </nav>
      <div className="workspace">
        <aside className="editor" aria-label={`${currentStage.name} controls`}>
          <div className="editor-title">
            <div>
              <span className="eyebrow">{currentStage.name.toUpperCase()}</span>
              <h1 ref={inspectorHeading}>{currentStage.title}</h1>
              <p>{currentStage.description}</p>
            </div>
          </div>
          {visibleParts.length > 0 && (
            <div
              className="part-selector"
              role="group"
              aria-label="Part to edit"
            >
              {visibleParts.map((value) => (
                <button
                  key={value}
                  className={part === value ? 'selected' : ''}
                  aria-pressed={part === value}
                  onClick={() => {
                    end();
                    setPart(value);
                  }}
                >
                  {partNames[value]}
                  {(value === 'lid' && !project.lidEnabled) ||
                  (value === 'diffuser' && !project.diffuserEnabled) ? (
                    <span className="optional-marker" title="Optional part">
                      +
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
          <div
            ref={scroll}
            className="editor-scroll"
            key={`${stage}-${part}`}
            onPointerDownCapture={(event) => {
              if (
                (event.target as HTMLElement).closest(
                  '[data-slot="slider"],input[type="range"]',
                )
              )
                begin();
            }}
            onKeyDownCapture={(event) => {
              if (
                [
                  'ArrowLeft',
                  'ArrowRight',
                  'ArrowUp',
                  'ArrowDown',
                  'Home',
                  'End',
                  'PageUp',
                  'PageDown',
                ].includes(event.key) &&
                (event.target as HTMLElement).closest(
                  '[data-slot="slider"],input[type="range"]',
                )
              )
                begin();
            }}
            onKeyUpCapture={end}
            onBlurCapture={(event) => {
              const fromSlider = (event.target as HTMLElement).closest(
                '[data-slot="slider"]',
              );
              const toSlider = (
                event.relatedTarget as HTMLElement | null
              )?.closest('[data-slot="slider"]');
              if (fromSlider && !toSlider) end();
            }}
          >
            {!ready ? (
              <p role="status" className="control-note">
                Restoring your lamp…
              </p>
            ) : (
              <>
                {stage === 'start' && (
                  <StartPanel
                    navigate={navigate}
                    openDesigns={() => setOpenRequest((value) => value + 1)}
                  />
                )}
                {stage === 'form' &&
                  (part === 'base' ? (
                    <BaseControls
                      section="form"
                      setView={inspect}
                      navigate={navigate}
                    />
                  ) : (
                    <ShadeControls
                      section="form"
                      setView={inspect}
                      navigate={navigate}
                    />
                  ))}
                {stage === 'surface' && (
                  <>
                    {part === 'shade' ? (
                      <ShadeControls
                        section="surface"
                        setView={inspect}
                        navigate={navigate}
                      />
                    ) : part === 'base' ? (
                      <BaseControls
                        section="surface"
                        setView={inspect}
                        navigate={navigate}
                      />
                    ) : (
                      <p className="control-note">
                        {partNames[part]} uses a smooth surface. Its dimensions
                        and construction are in Parts & fit.
                      </p>
                    )}
                    {showFinish && <FinishPicker part={part} />}
                  </>
                )}
                {stage === 'parts' &&
                  (part === 'shade' ? (
                    <ShadeControls
                      section="build"
                      setView={inspect}
                      navigate={navigate}
                    />
                  ) : part === 'base' ? (
                    <BaseControls
                      section="mount"
                      setView={inspect}
                      navigate={navigate}
                    />
                  ) : part === 'lid' ? (
                    <LidControls setView={inspect} />
                  ) : (
                    <ShadeControls
                      section="diffuser"
                      setView={inspect}
                      navigate={navigate}
                    />
                  ))}
                {stage === 'review' && (
                  <ReviewPanel
                    shadeModel={shadeModel}
                    gap={gap}
                    setGap={setGap}
                    showHardware={showHardware}
                    setShowHardware={setShowHardware}
                    inspectHardware={inspectHardware}
                    setInspectHardware={setInspectHardware}
                    navigate={navigate}
                  />
                )}
                {stage === 'export' && <ExportPanel />}
                {stage === 'form' && (
                  <details className="editor-disclosure">
                    <summary>Reset this part</summary>
                    <p className="control-note section-intro">
                      Restores the {partNames[part].toLowerCase()} defaults.
                      Other parts stay unchanged.
                    </p>
                    <button className="inspect-bottom" onClick={reset}>
                      <RotateCcw size={16} />
                      Reset {partNames[part].toLowerCase()}
                    </button>
                  </details>
                )}
              </>
            )}
          </div>
          <div className="editor-foot">
            <span>
              {stage === 'start'
                ? 'Your current design stays editable.'
                : 'All dimensions in millimeters'}
            </span>
            {nextStage && (
              <button onClick={() => navigate(nextStage.id)}>
                {nextStage.name}
                <ChevronRight size={15} />
              </button>
            )}
          </div>
        </aside>
        <section className="viewport" aria-label="Complete lamp 3D workspace">
          <div className="preview-context">
            <div>
              <span className="eyebrow">
                {previewMode === 'lamp' ? 'COMPLETE LAMP' : 'PART INSPECTION'}
              </span>
              <h2>{previewLabel}</h2>
              <p>
                {previewMode === 'lamp'
                  ? `${included} printed parts${project.base.e27Enabled ? ' · E27 mount' : ''}`
                  : displayName(
                      part === 'lid'
                        ? project.lid.source.shape
                        : part === 'diffuser'
                          ? 'smooth'
                          : project[part].shape,
                    )}
              </p>
            </div>
            <button
              className={`fit-badge ${attention ? 'needs-review' : ''}`}
              onClick={() => navigate('review')}
            >
              {attention ? <Layers3 size={15} /> : <Check size={15} />}
              <span>
                {attention ? 'Review connections' : 'Connections matched'}
              </span>
            </button>
          </div>
          <div className="preview-toolbar">
            <div
              className="preview-toggle"
              role="group"
              aria-label="Preview scope"
            >
              <button
                aria-pressed={previewMode === 'lamp'}
                onClick={() => {
                  setPreviewMode('lamp');
                  setInspectHardware(false);
                }}
              >
                <Layers3 size={15} />
                Complete lamp
              </button>
              <button
                aria-pressed={previewMode === 'part'}
                onClick={() => setPreviewMode('part')}
              >
                <Box size={15} />
                {partNames[part]} only
              </button>
            </div>
            {previewMode === 'part' &&
              part === 'shade' &&
              project.diffuserEnabled && (
                <label className="layer-selector">
                  <span className="sr-only">Inspect shade layers</span>
                  <select
                    value={layerView}
                    onChange={(event) => setLayerView(event.target.value)}
                  >
                    <option value="both">Both layers</option>
                    <option value="outer">Outer shade</option>
                    <option value="inner">Inner diffuser</option>
                  </select>
                </label>
              )}
          </div>
          <ModelPreview
            model={visibleModel}
            color={previewMode === 'part' ? project.finishes[part] : '#ffffff'}
            wireframe={wireframe}
            setWireframe={setWireframe}
            view={view}
            setView={setView}
            fitKey={`${previewMode}-${part}-${layerView}-${inspectHardware}-${ready}`}
          />
          <div className="dimensions-strip">
            <div>
              <span>
                {previewMode === 'lamp' ? 'ASSEMBLED HEIGHT' : 'HEIGHT'}
              </span>
              <strong>
                {(previewMode === 'lamp'
                  ? project.shade.height +
                    project.base.height +
                    (project.lidEnabled
                      ? project.lid.height - project.lid.grooveDepth
                      : 0)
                  : visibleModel.params.height
                ).toFixed(1)}
                <small>mm</small>
              </strong>
            </div>
            <div>
              <span>MAX WIDTH</span>
              <strong>
                {bounds[0].toFixed(1)}
                <small>mm</small>
              </strong>
            </div>
            <div>
              <span>
                {previewMode === 'lamp' ? 'PRINTED PARTS' : 'PREVIEW MESH'}
              </span>
              <strong>
                {previewMode === 'lamp'
                  ? included
                  : `${Math.round(visibleModel.indices.length / 3000)}k`}
                <small>
                  {previewMode === 'lamp' ? 'separate' : 'triangles'}
                </small>
              </strong>
            </div>
          </div>
        </section>
      </div>
      <footer className="statusbar">
        <div>
          <LockKeyhole size={13} />
          Private workspace<span className="status-divider">·</span>Preview
          colors are not exported
        </div>
        <span>Editable project · separate STL parts</span>
      </footer>
      <Toaster position="bottom-right" richColors />
    </main>
  );
}
