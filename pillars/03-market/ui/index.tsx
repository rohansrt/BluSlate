import { pillarInfo } from "@bluslate/contracts";
import { PillarPlaceholder } from "@bluslate/ui";
import { marketModule } from "../src/module";

const info = pillarInfo("market");

/** Market's workspace. A placeholder screen until the Build step. */
export function MarketScreen() {
  return (
    <PillarPlaceholder
      id={info.id}
      number={info.number}
      name={info.name}
      question={info.question}
      deliverable={info.deliverable}
      reads={marketModule.reads}
      writes={marketModule.writes}
    />
  );
}
