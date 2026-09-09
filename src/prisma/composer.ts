import { dataContract } from "@prisma/composer-prisma-cloud/orm";

import type { Contract } from "./generated/contract.d.ts";
import contractJson from "./generated/contract.json" with { type: "json" };

export const appContract = dataContract<Contract>(contractJson);
