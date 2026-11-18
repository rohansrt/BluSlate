"use client";

import { useRef, useState } from "react";
import { Check, Globe2, Link2, Loader2 } from "lucide-react";
import { Input, Label, Select } from "@bluslate/ui";
import { COUNTRY_OPTIONS } from "@/lib/countries";

export interface MarketValue {
  country: string | null;
  region: string | null;
}

/**
 * "Where will you launch?" (decision 0012). The market is one answer shared
 * by Customer Discovery and Market Research: it is stored once on the
 * startup, so changing it here changes it there, and money follows its
 * currency everywhere.
 */
export function TargetMarketCard({
  startupId,
  value,
  onSaved,
}: {
  startupId: string;
  value: MarketValue;
  onSaved: (next: { country: string; region: string; geography: string; currency: string }) => void;
}) {
  const [country, setCountry] = useState(value.country ?? "");
  const [region, setRegion] = useState(value.region ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const savedRegion = useRef(value.region ?? "");

  async function save(nextCountry: string, nextRegion: string) {
    if (!nextCountry) return;
    setState("saving");
    try {
      const res = await fetch(`/api/startups/${startupId}/market`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: nextCountry, region: nextRegion }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        geography?: string;
        currency?: string;
      };
      if (!res.ok || !body.geography || !body.currency) throw new Error();
      setState("saved");
      savedRegion.current = nextRegion;
      onSaved({
        country: nextCountry,
        region: nextRegion,
        geography: body.geography,
        currency: body.currency,
      });
    } catch {
      setState("error");
    }
  }

  return (
    <section
      className="rounded-xl border border-founder/40 bg-founder-soft/40 p-4 sm:p-5"
      aria-labelledby="target-market-title"
      data-testid="target-market"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="target-market-title" className="flex items-center gap-2 font-semibold">
            <Globe2 className="size-4 text-primary" aria-hidden /> Where will you launch?
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            The market you want to sell in, not where you live. Money is shown in its currency.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
          <Link2 className="size-3" aria-hidden /> Shared by Customer and Market
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="market-country">Country</Label>
          <Select
            id="market-country"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              void save(e.target.value, region);
            }}
          >
            <option value="" disabled>
              Choose a country
            </option>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="market-region">
            City or region <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="market-region"
            maxLength={80}
            value={region}
            placeholder="Pune, or all of Maharashtra"
            onChange={(e) => setRegion(e.target.value)}
            onBlur={() => {
              if (country && region !== savedRegion.current) void save(country, region);
            }}
          />
        </div>
      </div>
      <p className="mt-2 h-4 text-xs" role="status">
        {state === "saving" && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Loader2 className="size-3 animate-spin" aria-hidden /> Saving…
          </span>
        )}
        {state === "saved" && (
          <span className="inline-flex items-center gap-1 text-actual">
            <Check className="size-3" aria-hidden /> Saved for both steps
          </span>
        )}
        {state === "error" && <span className="text-danger">Couldn&apos;t save. Try again.</span>}
      </p>
    </section>
  );
}
