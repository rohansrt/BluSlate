import { pillarInfo } from "@bluslate/contracts";
import { PillarPlaceholder } from "@bluslate/ui";
import { customersModule } from "../src/module";

const info = pillarInfo("customers");

/** Customers' workspace. A placeholder screen until the Build step. */
export function CustomersScreen() {
  return (
    <PillarPlaceholder
      id={info.id}
      number={info.number}
      name={info.name}
      question={info.question}
      deliverable={info.deliverable}
      reads={customersModule.reads}
      writes={customersModule.writes}
    />
  );
}
