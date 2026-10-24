'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { usePreviewModel } from '@/hooks/use-preview-model';
import { mountingMatch } from '@/lib/assembly.mjs';
import { lidMatches } from '@/lib/lid-model.mjs';
import { useLampProject } from './project-context';

type Fit = { valid: boolean; clearance: number; issues: string[] };
type Checks = {
  mount: boolean;
  lid: boolean;
  diffuser: Fit;
  holder: Fit;
  diffuserUpdating: boolean;
  holderUpdating: boolean;
  diffuserError: string;
  holderError: string;
};
const FitContext = createContext<Checks | null>(null);
const pending: Fit = { valid: false, clearance: 0, issues: [] };

export function FitChecksProvider({ children }: { children: ReactNode }) {
  const { project, ready } = useLampProject();
  const diffuser = usePreviewModel(
    'diffuser-fit',
    {
      diffuser: project.diffuser,
      shade: project.shade,
    },
    pending,
    ready,
  );
  const holder = usePreviewModel(
    'e27-fit',
    {
      shade: project.shade,
      base: project.base,
    },
    pending,
    ready && project.base.e27Enabled,
  );
  const mount = useMemo(() => mountingMatch(project), [project]);
  const lid = useMemo(
    () => lidMatches(project.lid, project.shade),
    [project.lid, project.shade],
  );
  return (
    <FitContext.Provider
      value={{
        mount,
        lid,
        diffuser: diffuser.model,
        holder: holder.model,
        diffuserUpdating: diffuser.updating,
        holderUpdating: holder.updating,
        diffuserError: diffuser.error,
        holderError: holder.error,
      }}
    >
      {children}
    </FitContext.Provider>
  );
}

export function useFitChecks() {
  const checks = useContext(FitContext);
  if (!checks) throw new Error('FitChecksProvider is required.');
  return checks;
}
