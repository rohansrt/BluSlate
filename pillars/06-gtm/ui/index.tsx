import { pillarInfo } from "@bluslate/contracts";
import { PillarPlaceholder } from "@bluslate/ui";
import { gtmModule } from "../src/module";

const info = pillarInfo("gtm");

/** Go to Market's workspace. A placeholder screen until the Build step. */
export function GtmScreen() {
  return (
    <PillarPlaceholder
      id={info.id}
      number={info.number}
      name={info.name}
      question={info.question}
      deliverable={info.deliverable}
      reads={gtmModule.reads}
      writes={gtmModule.writes}
    />
  );
}
