import type { Hotspot } from "@silent-forge/content";

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
          className="hotspot"
          aria-label={h.label}
          data-label={h.label}
          style={{
            left: `${h.x}%`,
            top: `${h.y}%`,
            width: `${h.w}%`,
            height: `${h.h}%`,
          }}
          onClick={() => onActivate(h)}
        />
      ))}
    </div>
  );
}
