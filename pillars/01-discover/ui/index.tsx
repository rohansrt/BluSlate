import { pillarInfo } from "@bluslate/contracts";
import { PillarPlaceholder } from "@bluslate/ui";
import { discoverModule } from "../src/module";

const info = pillarInfo("discover");

/** Discover's workspace. A placeholder screen until the Build step. */
export function DiscoverScreen() {
  return (
    <PillarPlaceholder
      id={info.id}
      number={info.number}
      name={info.name}
      question={info.question}
      deliverable={info.deliverable}
      reads={discoverModule.reads}
      writes={discoverModule.writes}
    />
  );
}
