import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const runtimeEnv = (import.meta as any).env;

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: z.url(),
  },
  runtimeEnv: {
    ...runtimeEnv,
    VITE_SERVER_URL:
      runtimeEnv.VITE_SERVER_URL || (runtimeEnv.DEV ? "http://localhost:3000" : undefined),
  },
  emptyStringAsUndefined: true,
});
