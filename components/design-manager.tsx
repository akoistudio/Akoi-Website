'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Save,
  FolderOpen,
  Download,
  Upload,
  Trash2,
  LoaderCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { validateProject } from '@/lib/design-project.mjs';
import {
  useLampProject,
  type Project,
} from '@/components/studio/project-context';
import { downloadProject } from '@/components/studio/export-panel';
import { displayName } from '@/components/studio/catalog';

type Design = { id: string; name: string; project: Project; updatedAt: string };
export default function DesignManager({
  openRequest = 0,
  onLoad,
}: {
  openRequest?: number;
  onLoad: () => void;
}) {
  const { project, active, dirty, ready, load, markSaved, clearActive } =
    useLampProject();
  const [open, setOpen] = useState(false),
    [mode, setMode] = useState<'collection' | 'saveAs'>('collection');
  const [name, setName] = useState('My lamp'),
    [designs, setDesigns] = useState<Design[]>([]);
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null),
    nameInput = useRef<HTMLInputElement>(null);
  const saveLock = useRef(false);
  useEffect(() => {
    if (openRequest) {
      // The Start panel requests the shared project dialog after a user action.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode('collection');
      setOpen(true);
    }
  }, [openRequest]);
  useEffect(() => {
    if (open && mode === 'saveAs') nameInput.current?.focus();
  }, [open, mode]);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch('/api/designs', {
          cache: 'no-store',
          signal,
        }),
        data = (await response.json()) as { error?: string; designs: Design[] };
      if (!response.ok)
        throw new Error(data.error || 'Could not read saved designs.');
      setDesigns(data.designs);
      setError('');
    } catch (e) {
      if (!signal?.aborted)
        setError(
          e instanceof Error ? e.message : 'Could not read saved designs.',
        );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!open || mode !== 'collection') return;
    const controller = new AbortController();
    // Refresh on opening; cleanup cancels requests for a closed dialog.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh(controller.signal);
    return () => controller.abort();
  }, [open, mode, refresh]);
  const openSaveAs = () => {
    setName(active ? `${active.name} copy`.slice(0, 80) : 'My lamp');
    setMode('saveAs');
    setOpen(true);
  };
  const save = async (asNew = false) => {
    if (saveLock.current || !ready) return;
    if (!asNew && !active) {
      openSaveAs();
      return;
    }
    saveLock.current = true;
    setBusy(true);
    const snapshot = project,
      target = asNew ? null : active;
    try {
      const response = await fetch(
        '/api/designs' + (target ? `?id=${encodeURIComponent(target.id)}` : ''),
        {
          method: target ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: target ? target.name : name.trim(),
            project: snapshot,
          }),
        },
      );
      const data = (await response.json()) as {
        error?: string;
        design: Design;
      };
      if (!response.ok) {
        if (response.status === 404 && target) clearActive();
        throw new Error(data.error || 'Save failed.');
      }
      markSaved(snapshot, data.design);
      toast.success(`Saved ${data.design.name}`);
      if (mode === 'saveAs') setOpen(false);
      else if (open) await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      saveLock.current = false;
      setBusy(false);
    }
  };
  const openDesign = (design: Design) => {
    load(design.project, design);
    setOpen(false);
    onLoad();
    toast.success(`Opened ${design.name}`);
  };
  const importFile = async (file?: File) => {
    if (!file || busy) return;
    try {
      if (file.size > 16000)
        throw new Error('Choose an AKŌI project file smaller than 16 KB.');
      load(validateProject(JSON.parse(await file.text())));
      setOpen(false);
      onLoad();
      toast.success(
        'Editable project imported. Use Save as to create a saved design.',
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not import project.');
    } finally {
      if (input.current) input.current.value = '';
    }
  };
  const remove = async (design: Design) => {
    if (
      busy ||
      !window.confirm(
        `Delete “${design.name}” from saved designs? Your current working lamp stays open.`,
      )
    )
      return;
    setBusy(true);
    try {
      const response = await fetch(
        `/api/designs?id=${encodeURIComponent(design.id)}`,
        { method: 'DELETE' },
      );
      if (!response.ok) throw new Error('Could not delete this design.');
      if (active?.id === design.id) clearActive();
      await refresh();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Could not delete this design.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button
        className="designs-button direct-save"
        disabled={busy || !ready || (!dirty && !!active)}
        title={
          active ? `Save changes to ${active.name}` : 'Save as a new design'
        }
        onClick={() => save()}
      >
        {busy ? (
          <LoaderCircle size={16} className="loading-icon" />
        ) : (
          <Save size={16} />
        )}
        <span>{busy ? 'Saving…' : 'Save'}</span>
      </button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) {
            if (value) setMode('collection');
            setOpen(value);
          }
        }}
      >
        <DialogTrigger asChild>
          <button className="designs-button saved-designs-trigger">
            <FolderOpen size={16} />
            <span>Saved designs</span>
          </button>
        </DialogTrigger>
        <DialogContent
          className="studio-dialog"
          onOpenAutoFocus={(event) => {
            if (mode === 'saveAs') {
              event.preventDefault();
              nameInput.current?.focus();
            }
          }}
        >
          <DialogTitle>
            {mode === 'saveAs' ? 'Save a new design' : 'Your projects'}
          </DialogTitle>
          <DialogDescription>
            Complete lamps with all parts, parameters, and preview finishes.
          </DialogDescription>
          {mode === 'saveAs' ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (name.trim()) save(true);
              }}
            >
              <label htmlFor="design-name">Design name</label>
              <input
                ref={nameInput}
                id="design-name"
                value={name}
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
              />
              <button
                className="export-button"
                type="submit"
                disabled={busy || !name.trim()}
              >
                <Save size={16} />
                {busy ? 'Saving…' : 'Save new design'}
              </button>
            </form>
          ) : (
            <>
              {active && (
                <div className="active-design-label">
                  <strong>Current project</strong>
                  <span>{active.name}</span>
                  <small>{dirty ? 'Unsaved changes' : 'Saved'}</small>
                </div>
              )}
              <div className="project-actions">
                <button disabled={busy || !ready} onClick={openSaveAs}>
                  <Save size={15} />
                  Save as…
                </button>
                {active && (
                  <button disabled={busy || !dirty} onClick={() => save()}>
                    Save changes
                  </button>
                )}
              </div>
            </>
          )}
          <div className="project-actions">
            <button
              disabled={!ready}
              onClick={() =>
                downloadProject(project, active?.name || 'My lamp')
              }
            >
              <Download size={15} />
              Download project
            </button>
            <button
              disabled={busy || !ready}
              onClick={() => input.current?.click()}
            >
              <Upload size={15} />
              Import project
            </button>
            <input
              hidden
              ref={input}
              type="file"
              accept=".json,.akoi.json,application/json"
              onChange={(event) => importFile(event.target.files?.[0])}
            />
          </div>
          <p className="control-note">
            Project files stay editable. STL downloads are available in Export
            and contain geometry only.
          </p>
          {mode === 'collection' && (
            <div className="saved-design-list">
              {loading ? (
                <p role="status">Loading projects…</p>
              ) : error ? (
                <div>
                  <p role="alert" className="design-error">
                    {error}
                  </p>
                  <button onClick={() => refresh()}>Retry</button>
                </div>
              ) : designs.length ? (
                designs.map((design) => (
                  <div key={design.id}>
                    <button disabled={busy} onClick={() => openDesign(design)}>
                      <FolderOpen size={17} />
                      <span>
                        <strong>{design.name}</strong>
                        <small>
                          {displayName(design.project.shade.shape)} shade ·{' '}
                          {new Date(design.updatedAt).toLocaleDateString()}
                        </small>
                      </span>
                    </button>
                    <button
                      disabled={busy}
                      aria-label={`Delete ${design.name}`}
                      onClick={() => remove(design)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p>
                  No saved designs yet. Save your first lamp or import an
                  editable project.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
