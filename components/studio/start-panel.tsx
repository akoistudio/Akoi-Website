'use client';
import { FolderOpen, Plus, Shuffle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useRef } from 'react';
import { SCULPTURE_PRESETS } from '@/lib/sculpture-presets.mjs';
import { mushroomProject } from '@/lib/mushroom-project.mjs';
import { DEFAULTS, PRESETS } from '@/lib/model.mjs';
import { BASE_DEFAULTS, matchShadeBase } from '@/lib/base-model.mjs';
import { DIFFUSER_DEFAULTS } from '@/lib/diffuser-model.mjs';
import { LID_DEFAULTS } from '@/lib/lid-model.mjs';
import { randomShade } from '@/lib/random-shade.mjs';
import { useLampProject, type Stage, type Part } from './project-context';
import { ShapeGlyph } from './pickers';

type Props = {
  navigate: (stage: Stage, part?: Part) => void;
  openDesigns: () => void;
};
export default function StartPanel({ navigate, openDesigns }: Props) {
  const { project, commit } = useLampProject();
  const previousFamily = useRef('');
  const shuffle = () => {
    try {
      const result = randomShade(
        project.shade,
        Math.random,
        previousFamily.current,
      );
      if (commit({ ...project, shade: result.params })) {
        previousFamily.current = result.family;
        navigate('form', 'shade');
        toast.success(result.family, {
          description:
            'Socket opening and wall thickness kept. Other parts are unchanged.',
        });
      }
    } catch (e) {
      toast.error(String(e));
    }
  };
  const complete = (kind: string) => {
    try {
      let next;
      if (kind === 'mushroom') next = mushroomProject();
      else {
        const shade =
          kind === 'layered'
            ? {
                ...DEFAULTS,
                ...PRESETS['rounded-cylinder'],
                shape: 'rounded-cylinder',
                socketDiameter: 42,
              }
            : {
                ...DEFAULTS,
                ...SCULPTURE_PRESETS.find((s) => s.name === 'Soft swirl')!
                  .params,
              };
        next = {
          ...project,
          shade,
          base: matchShadeBase({ ...BASE_DEFAULTS }, shade),
          lid: { ...LID_DEFAULTS },
          lidEnabled: false,
          diffuser: { ...DIFFUSER_DEFAULTS },
          diffuserEnabled: kind === 'layered',
          finishes: {
            shade: '#c9bda5',
            base: '#74513d',
            lid: '#c9bda5',
            diffuser: '#f4eddf',
          },
        };
      }
      if (commit(next)) {
        navigate('form', 'shade');
        toast.success(
          'Complete lamp template loaded. Undo restores your previous design.',
        );
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Could not load the template.',
      );
    }
  };
  const study = (name: string) => {
    try {
      const shade =
        name === 'Layered lantern'
          ? {
              ...DEFAULTS,
              ...PRESETS['rounded-cylinder'],
              shape: 'rounded-cylinder',
              socketDiameter: 42,
            }
          : {
              ...DEFAULTS,
              ...SCULPTURE_PRESETS.find((s) => s.name === name)!.params,
            };
      if (
        commit({
          ...project,
          shade,
          diffuser:
            name === 'Layered lantern'
              ? { ...DIFFUSER_DEFAULTS }
              : project.diffuser,
          diffuserEnabled: name === 'Layered lantern',
        })
      )
        navigate('form', 'shade');
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Could not load the starting point.',
      );
    }
  };
  return (
    <>
      <section>
        <div className="section-label">
          <h2>Complete lamp templates</h2>
          <span>Shade + base</span>
        </div>
        <p className="control-note section-intro">
          Replaces the complete lamp. Every part stays editable, and Undo brings
          your previous design back.
        </p>
        <div className="template-list">
          {[
            {
              id: 'mushroom',
              shape: 'mushroom',
              name: 'Mushroom lamp',
              description: 'A broad cap and tall E27 stem.',
            },
            {
              id: 'swirl',
              shape: 'flowing-folds',
              name: 'Soft swirl lamp',
              description: 'Sculptural folds with a matching base.',
            },
            {
              id: 'layered',
              shape: 'rounded-cylinder',
              name: 'Layered lantern',
              description: 'Rounded shoulders and an inner diffuser.',
            },
          ].map((template) => (
            <button
              key={template.id}
              className="template-card"
              onClick={() => complete(template.id)}
            >
              <div className="template-glyph">
                <ShapeGlyph shape={template.shape} />
              </div>
              <span>
                <strong>{template.name}</strong>
                <small>{template.description}</small>
              </span>
              <Plus size={17} />
            </button>
          ))}
        </div>
      </section>
      <div className="start-actions">
        <button
          className="inspect-bottom"
          onClick={() => navigate('form', 'shade')}
        >
          <Plus size={16} />
          Custom lamp
        </button>
        <button className="inspect-bottom" onClick={openDesigns}>
          <FolderOpen size={16} />
          Open project
        </button>
      </div>
      <p className="control-note">
        Custom lamp continues your current design without replacing it.
      </p>
      <section className="control-section">
        <h2>Explore a shade</h2>
        <button className="random-shade-button" onClick={shuffle}>
          <Shuffle size={17} />
          Random shade
        </button>
        <p className="control-note">
          Changes the shade only. Keeps your socket opening and wall thickness.
        </p>
        <details className="editor-disclosure">
          <summary>All shade starting points</summary>
          <div className="study-list">
            {SCULPTURE_PRESETS.map((s) => (
              <button key={s.name} onClick={() => study(s.name)}>
                <strong>{s.name}</strong>
                <span>{s.description}</span>
              </button>
            ))}
          </div>
        </details>
      </section>
      <section className="control-section">
        <h2>Have a holder already?</h2>
        <p className="control-note section-intro">
          Set its dimensions first, then shape the lamp around it.
        </p>
        <button
          className="inspect-bottom"
          onClick={() => navigate('parts', 'base')}
        >
          Set holder & socket
        </button>
      </section>
      <p className="start-footnote">
        <Check size={15} />
        Move freely between stages. Your lamp stays together.
      </p>
    </>
  );
}
