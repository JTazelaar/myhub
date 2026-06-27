import type { EventDetail } from '../types';
import { FoursomeCard } from './FoursomeCard';
import { PointsTable } from './PointsTable';

export function EventDetailView({ event }: { event: EventDetail }) {
  return (
    <div className="space-y-6">
      {event.segments.map((seg) => (
        <div key={seg.id}>
          <h4 className="font-display font-bold text-green-800 mb-2">
            {seg.name} <span className="text-sm text-green-500">(Holes {seg.hole_start}&ndash;{seg.hole_end})</span>
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {seg.foursomes.map((f) => (
              <FoursomeCard key={f.id} foursome={f} handicapsEnabled={event.handicaps_enabled} />
            ))}
          </div>
        </div>
      ))}

      {event.points.length > 0 && (
        <div>
          <h4 className="font-display font-bold text-green-800 mb-2">Final Points</h4>
          <PointsTable points={event.points} />
        </div>
      )}
    </div>
  );
}
