import {
  ChevronDown,
  Image as ImageIcon,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useRef, useState } from "react";
import type { EditorOptions } from "../types/cutout";

interface OptionsPanelProps {
  options: EditorOptions;
  onChange: (options: EditorOptions) => void;
  disabled?: boolean;
}

interface RangeRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
  title: string;
}

function RangeRow({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
  title,
}: RangeRowProps) {
  return (
    <div className="range-row" title={title}>
      <label>
        <span>{label}</span>
        <output>
          {value}
          {suffix}
        </output>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
    </div>
  );
}

export default function OptionsPanel({
  options,
  onChange,
  disabled,
}: OptionsPanelProps) {
  const backgroundInput = useRef<HTMLInputElement>(null);
  const [edgeOpen, setEdgeOpen] = useState(true);
  const set = <Key extends keyof EditorOptions>(
    key: Key,
    value: EditorOptions[Key],
  ) => onChange({ ...options, [key]: value });

  return (
    <aside
      className={`options-panel ${disabled ? "is-disabled" : ""}`}
      aria-label="Edit options"
    >
      <div className="panel-heading">
        <SlidersHorizontal size={18} />
        <div>
          <strong>Edit your cutout</strong>
          <span>Changes preview instantly</span>
        </div>
      </div>

      <section className="option-section">
        <h2>
          <span>
            <ImageIcon size={16} /> Background
          </span>
        </h2>
        <div className="background-grid">
          {(
            [
              ["transparent", "Transparent", "checker-swatch"],
              ["solid", "Solid colour", "solid-swatch"],
              ["custom", "Custom image", "image-swatch"],
              ["blur", "Blur original", "blur-swatch"],
            ] as const
          ).map(([value, label, swatch]) => (
            <label
              className={`background-option ${options.background === value ? "selected" : ""}`}
              key={value}
              title={`Use a ${label.toLowerCase()} background`}
            >
              <input
                type="radio"
                name="background"
                value={value}
                checked={options.background === value}
                onChange={() => set("background", value)}
              />
              <i className={swatch} /> <span>{label}</span>
            </label>
          ))}
        </div>

        {options.background === "solid" && (
          <label
            className="colour-row"
            title="Choose the solid background colour"
          >
            <span>Background colour</span>
            <input
              type="color"
              value={options.solidColor}
              onChange={(event) => set("solidColor", event.target.value)}
            />
          </label>
        )}
        {options.background === "custom" && (
          <div className="custom-background">
            <input
              ref={backgroundInput}
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (options.customBackgroundUrl)
                  URL.revokeObjectURL(options.customBackgroundUrl);
                onChange({
                  ...options,
                  customBackground: file,
                  customBackgroundUrl: URL.createObjectURL(file),
                });
              }}
              aria-label="Choose custom background image"
            />
            <button
              type="button"
              className="secondary-button full"
              onClick={() => backgroundInput.current?.click()}
            >
              Choose background image
            </button>
            <label>
              Fit mode
              <select
                value={options.fitMode}
                onChange={(event) =>
                  set("fitMode", event.target.value as EditorOptions["fitMode"])
                }
                title="How the custom image fills the output"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="original">Original size</option>
              </select>
            </label>
          </div>
        )}
        {options.background === "blur" && (
          <RangeRow
            label="Blur radius"
            value={options.blurRadius}
            min={0}
            max={100}
            suffix="px"
            onChange={(value) => set("blurRadius", value)}
            title="Blur the original behind the subject"
          />
        )}
        <RangeRow
          label="Padding"
          value={options.padding}
          min={0}
          max={25}
          suffix="%"
          onChange={(value) => set("padding", value)}
          title="Add space around the subject"
        />

        {options.background !== "transparent" &&
          options.background !== "blur" && (
            <div className="toggle-stack">
              <label
                className="switch-row"
                title="Add a soft shadow behind the subject"
              >
                <span>Drop shadow</span>
                <input
                  type="checkbox"
                  checked={options.shadow}
                  onChange={(event) => set("shadow", event.target.checked)}
                />
                <i />
              </label>
              {options.shadow && (
                <>
                  <label className="colour-row">
                    <span>Shadow colour</span>
                    <input
                      type="color"
                      value={options.shadowColor}
                      onChange={(event) =>
                        set("shadowColor", event.target.value)
                      }
                    />
                  </label>
                  <RangeRow
                    label="Offset"
                    value={options.shadowOffset}
                    min={0}
                    max={40}
                    suffix="px"
                    onChange={(value) => set("shadowOffset", value)}
                    title="Move the shadow away from the subject"
                  />
                  <RangeRow
                    label="Shadow blur"
                    value={options.shadowBlur}
                    min={0}
                    max={60}
                    suffix="px"
                    onChange={(value) => set("shadowBlur", value)}
                    title="Soften the subject shadow"
                  />
                </>
              )}
            </div>
          )}
      </section>

      <section className="option-section">
        <button
          type="button"
          className="section-toggle"
          onClick={() => setEdgeOpen((value) => !value)}
          aria-expanded={edgeOpen}
        >
          <span>
            <Sparkles size={16} /> Edge refinement
          </span>
          <ChevronDown size={17} className={edgeOpen ? "rotated" : ""} />
        </button>
        {edgeOpen && (
          <div className="section-content">
            <RangeRow
              label="Feather edges"
              value={options.feather}
              min={0}
              max={5}
              step={0.5}
              suffix="px"
              onChange={(value) => set("feather", value)}
              title="Soften the cutout boundary"
            />
            <RangeRow
              label="Contract / expand"
              value={options.contractExpand}
              min={-3}
              max={3}
              suffix="px"
              onChange={(value) => set("contractExpand", value)}
              title="Shrink or grow the mask"
            />
            <RangeRow
              label="Threshold"
              value={options.threshold}
              min={0}
              max={100}
              onChange={(value) => set("threshold", value)}
              title="Control how much of ambiguous edges to keep"
            />
          </div>
        )}
      </section>

      <section className="option-section output-section">
        <h2>Output</h2>
        <label>
          Format
          <select
            value={options.format}
            onChange={(event) =>
              set("format", event.target.value as EditorOptions["format"])
            }
            title="Choose the downloaded file type"
          >
            <option value="png">PNG - transparency</option>
            <option
              value="jpeg"
              disabled={options.background === "transparent"}
            >
              JPG - smaller file
            </option>
            <option value="webp">WEBP - modern</option>
          </select>
        </label>
        {options.format !== "png" && (
          <RangeRow
            label="Quality"
            value={options.quality}
            min={60}
            max={100}
            suffix="%"
            onChange={(value) => set("quality", value)}
            title="Balance image quality and file size"
          />
        )}
        <label>
          Max dimension
          <select
            value={options.maxDimension}
            onChange={(event) =>
              set(
                "maxDimension",
                event.target.value === "original"
                  ? "original"
                  : (Number(event.target.value) as 2048 | 1024 | 512),
              )
            }
            title="Resize the longest output edge"
          >
            <option value="original">Original size</option>
            <option value="2048">2048 px</option>
            <option value="1024">1024 px</option>
            <option value="512">512 px</option>
          </select>
        </label>
      </section>
    </aside>
  );
}
