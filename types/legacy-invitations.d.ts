declare module "@legacy/jessicakhulaya/page" {
  import type { FC } from "react";
  const Page: FC;
  export default Page;
}

declare module "@legacy/jessicakhulaya/globals.css";

declare module "@legacy/jessicakhulaya/context" {
  import type { FC, ReactNode } from "react";
  export const AppProvider: FC<{ children: ReactNode }>;
}

declare module "@legacy/lobolo/page" {
  import type { FC } from "react";
  const Page: FC;
  export default Page;
}

declare module "@legacy/lobolo/globals.css";

declare module "@legacy/lobolo/lenis" {
  import type { FC, ReactNode } from "react";
  export const LenisProvider: FC<{ children: ReactNode }>;
}

declare module "@legacy/traditional/page" {
  import type { FC } from "react";
  const Page: FC;
  export default Page;
}

declare module "@legacy/traditional/globals.css";
