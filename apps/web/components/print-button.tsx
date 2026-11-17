"use client";

import { Printer } from "lucide-react";
import { Button } from "@bluslate/ui";

/** Print or save the page as PDF through the browser. */
export function PrintButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <Printer aria-hidden /> Print or save as PDF
    </Button>
  );
}
