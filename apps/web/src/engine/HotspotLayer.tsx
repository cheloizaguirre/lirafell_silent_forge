import type { Hotspot } from "@silent-forge/content";

// Two render modes: the default invisible hover/tap region over drawn art,
// and `chip` -- an always-visible labeled button for hotspots that have no
// art underneath (corner exits). Chips skip the data-label tooltip; their
// label is already on screen.
export function HotspotLayer({
  hotspots,
  onActivate,
}: {
  hotspots: Hotspot[];
  onActivate: (hotspot: Hotspot) => void;
}) {
  return (
    <div className="hotspot-layer">
      {hotspots.map((h) => (
        <button
          key={h.id}
          type="button"
          className={h.chip ? "hotspot hotspot-chip" : "hotspot"}
          aria-label={h.label}
          data-label={h.chip ? undefined : h.label}
          style={{
            left: `${h.x}%`,
            top: `${h.y}%`,
            width: `${h.w}%`,
            height: `${h.h}%`,
          }}
          onClick={() => onActivate(h)}
        >
          {h.chip ? h.label : null}
        </button>
      ))}
    </div>
  );
}
