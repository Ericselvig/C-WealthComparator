import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";


export default defineConfig([
  {
    out: "src/generated/abis.ts",
    plugins: [
      foundry({
        project: "../contracts/",
        include: ["ConfidentialWealthComparator.sol/**"],
      }),
    ],
  },
]);
