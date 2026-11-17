import { pillarInfo } from "@bluslate/contracts";
import { PillarPlaceholder } from "@bluslate/ui";
import { buildModule } from "../src/module";

const info = pillarInfo("build");

/** Build's workspace. A placeholder screen until the Build step. */
export function BuildScreen() {
  return (
    <PillarPlaceholder
      id={info.id}
      number={info.number}
      name={info.name}
      question={info.question}
      deliverable={info.deliverable}
      reads={buildModule.reads}
      writes={buildModule.writes}
    />
  );
}
