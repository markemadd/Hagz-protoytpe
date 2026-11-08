import { OwnerShell } from "@/components/owner/owner-shell";

/** Court-owner app (Karim): responsive desktop dashboard. */
export default function OwnerLayout({ children }: LayoutProps<"/owner">) {
  return <OwnerShell>{children}</OwnerShell>;
}
