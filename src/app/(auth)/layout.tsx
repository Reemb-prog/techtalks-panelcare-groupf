import { AdaptersProvider } from "@/components/layout/adapters-provider";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdaptersProvider>{children}</AdaptersProvider>;
}
