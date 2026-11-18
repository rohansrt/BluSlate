"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@bluslate/ui";
import { setNoTrack } from "@/lib/analytics/client";

const KEY = "bluslate.no-track";
const noop = () => () => {};
const read = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

/** Turn BluSlate's own analytics off (or back on) in this browser (docs/decisions/0011). */
export function AnalyticsOptOut() {
  const stored = useSyncExternalStore(noop, read, () => false);
  const [override, setOverride] = useState<boolean | null>(null);
  const off = override ?? stored;
  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="analytics-opt-out">
      <p className="text-sm">
        Analytics in this browser: <strong>{off ? "off" : "on"}</strong>
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          setNoTrack(!off);
          setOverride(!off);
        }}
      >
        {off ? "Turn analytics back on" : "Turn analytics off"}
      </Button>
    </div>
  );
}
