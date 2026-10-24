'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import {
  currentProject,
  restoreProject,
  validateProject,
} from '@/lib/design-project.mjs';
import { readActiveDesign, setActiveDesign } from '@/lib/active-design.mjs';
import { createProjectHistory } from '@/lib/project-history.mjs';
import { DEFAULTS, applyParameterPatch } from '@/lib/model.mjs';
import { BASE_DEFAULTS, patchBase } from '@/lib/base-model.mjs';
import { validateLid } from '@/lib/lid-model.mjs';
import { validateDiffuser } from '@/lib/diffuser-model.mjs';

export type Part = 'shade' | 'base' | 'lid' | 'diffuser';
export type Stage =
  'start' | 'form' | 'surface' | 'parts' | 'review' | 'export';
export type Project = ReturnType<typeof validateProject>;
type Active = { id: string; name: string } | null;
type Context = {
  project: Project;
  ready: boolean;
  active: Active;
  dirty: boolean;
  saved: boolean;
  commit: (next: Project) => boolean;
  edit: (part: Part, patch: Partial<Project[Part]>) => void;
  setFinish: (part: Part, color: string) => void;
  load: (project: Project, active?: Active) => void;
  markSaved: (snapshot: Project, active: NonNullable<Active>) => void;
  clearActive: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  begin: () => void;
  end: () => void;
};
const LampContext = createContext<Context | null>(null);
const initialProject = () =>
  validateProject({
    format: 'akoi-design',
    version: 1,
    shade: { ...DEFAULTS },
    base: { ...BASE_DEFAULTS },
  });
const fingerprint = (p: Project) => JSON.stringify(p);

export function LampProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project>(initialProject);
  const [ready, setReady] = useState(false),
    [active, setActive] = useState<Active>(null);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [ledger] = useState(() => createProjectHistory(project));

  useEffect(() => {
    try {
      const restored = currentProject(sessionStorage);
      ledger.replace(restored);
      // Hydrate the existing browser working project after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProject(restored);
      setActive(readActiveDesign(sessionStorage));
      setBaseline(sessionStorage.getItem('akoi-saved-snapshot'));
    } catch {
      toast.error(
        'The working project could not be restored. You can import a project or open a saved design.',
      );
    }
    setReady(true);
  }, [ledger]);

  useEffect(() => {
    if (!ready) return;
    try {
      restoreProject(sessionStorage, project);
    } catch {
      toast.error(
        'Browser storage is unavailable. Save or download your project to keep your edits.',
      );
    }
  }, [project, ready]);

  const publish = useCallback(
    (next: Project) => {
      try {
        const checked = validateProject(next),
          previous = ledger.read();
        // Preserve references for unchanged parts so view-only edits do not rebuild meshes.
        for (const part of [
          'shade',
          'base',
          'lid',
          'diffuser',
          'finishes',
        ] as const) {
          if (JSON.stringify(checked[part]) === JSON.stringify(previous[part]))
            checked[part] = previous[part] as never;
        }
        setProject(ledger.commit(checked));
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Check the design settings.',
        );
        return false;
      }
    },
    [ledger],
  );
  const edit = useCallback(
    (part: Part, patch: Partial<Project[Part]>) => {
      const p = ledger.read();
      try {
        const next =
          part === 'shade'
            ? applyParameterPatch(p.shade, patch)
            : part === 'base'
              ? patchBase(p.base, patch)
              : part === 'lid'
                ? validateLid({ ...p.lid, ...patch })
                : validateDiffuser({ ...p.diffuser, ...patch });
        publish({ ...p, [part]: next });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Check the design settings.',
        );
      }
    },
    [publish, ledger],
  );
  const setFinish = useCallback(
    (part: Part, color: string) => {
      const p = ledger.read();
      publish({ ...p, finishes: { ...p.finishes, [part]: color } });
    },
    [publish, ledger],
  );
  const updateIdentity = (next: Active) => {
    setActive(next);
    try {
      setActiveDesign(sessionStorage, next);
    } catch {
      /* Saving still works without browser storage. */
    }
  };
  const markSaved = (snapshot: Project, next: NonNullable<Active>) => {
    updateIdentity(next);
    const value = fingerprint(snapshot);
    setBaseline(value);
    try {
      sessionStorage.setItem('akoi-saved-snapshot', value);
    } catch {
      /* Visible save state remains accurate. */
    }
  };
  const load = (input: Project, identity: Active = null) => {
    // Opening another project starts its own history. Templates use commit()
    // instead, so replacing the current lamp with a template stays undoable.
    const next = validateProject(input);
    ledger.replace(next);
    setProject(next);
    updateIdentity(identity);
    const value = identity ? fingerprint(next) : null;
    setBaseline(value);
    try {
      if (value) sessionStorage.setItem('akoi-saved-snapshot', value);
      else sessionStorage.removeItem('akoi-saved-snapshot');
    } catch {
      /* The imported project remains editable. */
    }
  };
  const clearActive = () => {
    updateIdentity(null);
    setBaseline(null);
    try {
      sessionStorage.removeItem('akoi-saved-snapshot');
    } catch {}
  };
  const begin = useCallback(() => ledger.begin(), [ledger]);
  const end = useCallback(() => ledger.end(), [ledger]);
  const undo = useCallback(() => setProject(ledger.undo()), [ledger]);
  const redo = useCallback(() => setProject(ledger.redo()), [ledger]);
  useEffect(() => {
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    window.addEventListener('blur', end);
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest(
          'input, textarea, select, [contenteditable="true"], [role="dialog"]',
        )
      )
        return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      window.removeEventListener('blur', end);
      window.removeEventListener('keydown', key);
    };
  }, [end, undo, redo]);

  return (
    <LampContext.Provider
      value={{
        project,
        ready,
        active,
        dirty: baseline !== fingerprint(project),
        saved: baseline !== null,
        commit: publish,
        edit,
        setFinish,
        load,
        markSaved,
        clearActive,
        undo,
        redo,
        canUndo: ledger.canUndo,
        canRedo: ledger.canRedo,
        begin,
        end,
      }}
    >
      {children}
    </LampContext.Provider>
  );
}

export function useLampProject() {
  const context = useContext(LampContext);
  if (!context) throw new Error('LampProjectProvider is required.');
  return context;
}
