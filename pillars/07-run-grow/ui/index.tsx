import { pillarInfo } from "@bluslate/contracts";
import { PillarPlaceholder } from "@bluslate/ui";
import { runGrowModule } from "../src/module";

const info = pillarInfo("run-grow");

/** Run & Grow's workspace. A placeholder screen until the Build step. */
export function RunGrowScreen() {
  return (
    <PillarPlaceholder
      id={info.id}
      number={info.number}
      name={info.name}
      question={info.question}
      deliverable={info.deliverable}
      reads={runGrowModule.reads}
      writes={runGrowModule.writes}
    />
  );
}
