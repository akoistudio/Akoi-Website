'use client';
import { useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DEFAULTS, PRESETS, radiusAt, TEXTURES } from '@/lib/model.mjs';
import { displayName, finishes, partNames } from './catalog';
import { useLampProject, type Part } from './project-context';

export function ShapeGlyph({ shape }: { shape: string }) {
  const p = {
    ...DEFAULTS,
    ...PRESETS[shape as keyof typeof PRESETS],
    shape,
    texture: 'smooth',
    textureDepth: 0,
  };
  const side = Array.from({ length: 25 }, (_, i) => {
    const t = i / 24;
    return [(radiusAt(p, t, 0) / p.diameter) * 25, 46 - t * 38];
  });
  const path =
    `M ${32 - side[0][0]},${side[0][1]} ` +
    side.map(([x, y]) => `L ${32 - x},${y}`).join(' ') +
    side
      .slice()
      .reverse()
      .map(([x, y]) => `L ${32 + x},${y}`)
      .join(' ') +
    ' Z';
  return (
    <svg viewBox="0 0 64 56" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function ShapePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const disclosure = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={disclosure} className="choice-picker">
      <summary>
        <ShapeGlyph shape={value} />
        <span>
          <small>Starting shape</small>
          <strong>{displayName(value)}</strong>
        </span>
        <ChevronDown size={17} />
      </summary>
      <RadioGroup
        aria-label="Starting shape"
        value={value}
        onValueChange={(shape) => {
          onChange(shape);
          if (disclosure.current) disclosure.current.open = false;
        }}
      >
        {[
          {
            name: 'Classic',
            shapes: [
              'bell',
              'drum',
              'cone',
              'vase',
              'hourglass',
              'dome',
              'lantern',
              'pebble',
              'orb',
              'rounded-cylinder',
            ],
          },
          {
            name: 'Geometric',
            shapes: ['cube', 'pyramid', 'hexagon', 'oval', 'rounded-square'],
          },
          {
            name: 'Sculptural',
            shapes: ['sculpted', 'stacked', 'flowing-folds', 'mushroom'],
          },
        ].map((group) => (
          <div key={group.name}>
            <p className="picker-group">{group.name}</p>
            <div className="shape-grid">
              {group.shapes.map((shape) => (
                <label
                  key={shape}
                  className={`shape-card ${shape === value ? 'selected' : ''}`}
                >
                  <RadioGroupItem value={shape} className="choice-radio" />
                  <ShapeGlyph shape={shape} />
                  <span>{displayName(shape)}</span>
                  {shape === value && <Check className="selected-check" />}
                </label>
              ))}
            </div>
          </div>
        ))}
      </RadioGroup>
    </details>
  );
}

export function TexturePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const disclosure = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={disclosure} className="choice-picker texture-picker">
      <summary>
        <span className={`texture-sample texture-${value}`} />
        <span>
          <small>Selected texture</small>
          <strong>{displayName(value)}</strong>
        </span>
        <ChevronDown size={17} />
      </summary>
      <RadioGroup
        className="texture-picker-grid"
        aria-label="Shade texture"
        value={value}
        onValueChange={(texture) => {
          onChange(texture);
          if (disclosure.current) disclosure.current.open = false;
        }}
      >
        {TEXTURES.map((texture) => (
          <label
            key={texture}
            className={`texture-card ${value === texture ? 'selected' : ''}`}
          >
            <RadioGroupItem value={texture} className="choice-radio" />
            <span className={`texture-sample texture-${texture}`} />
            <span>{displayName(texture)}</span>
            {value === texture && <Check size={15} />}
          </label>
        ))}
      </RadioGroup>
    </details>
  );
}

export function FinishPicker({ part }: { part: Part }) {
  const { project, setFinish } = useLampProject();
  return (
    <section className="control-section finish-section">
      <div className="section-label">
        <h2>Preview finish</h2>
        <span>{partNames[part]}</span>
      </div>
      <div className="assembly-swatches">
        {finishes.map((color) => (
          <button
            key={color.hex}
            aria-label={`${color.name} ${partNames[part].toLowerCase()} finish`}
            title={color.name}
            aria-pressed={project.finishes[part] === color.hex}
            style={{ backgroundColor: color.hex }}
            onClick={() => setFinish(part, color.hex)}
          >
            {project.finishes[part] === color.hex && (
              <Check
                size={16}
                color={
                  color.hex === '#343331' || color.hex === '#74513d'
                    ? '#fff'
                    : '#39382e'
                }
              />
            )}
          </button>
        ))}
      </div>
      <p className="control-note">
        {finishes.find((color) => color.hex === project.finishes[part])?.name ||
          'Custom finish'}{' '}
        · preview color is not exported.
      </p>
    </section>
  );
}
