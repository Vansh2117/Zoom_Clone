import type { ReactNode } from "react";

import { PortalShell } from "@/components/layout/shells";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
