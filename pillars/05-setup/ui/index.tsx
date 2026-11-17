import { pillarInfo } from "@bluslate/contracts";
import { PillarPlaceholder } from "@bluslate/ui";
import { setupModule } from "../src/module";

const info = pillarInfo("setup");

/** Set Up's workspace. A placeholder screen until the Build step. */
export function SetupScreen() {
  return (
    <PillarPlaceholder
      id={info.id}
      number={info.number}
      name={info.name}
      question={info.question}
      deliverable={info.deliverable}
      reads={setupModule.reads}
      writes={setupModule.writes}
    />
  );
}
