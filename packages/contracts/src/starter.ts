import type { PillarEntityType } from "./entity-types";

/**
 * The first question a pillar asks (spec §1.2 law 7: "every pillar opens with
 * one question"). Until a pillar's Build step, this one manual value is what
 * the founder can publish to the Twin from that pillar.
 */
export interface PillarStarter {
  entityType: PillarEntityType;
  /** The entity field the answer is stored in. */
  field: string;
  question: string;
  /** One line of help under the question. */
  hint: string;
  placeholder: string;
  maxLength: number;
}
