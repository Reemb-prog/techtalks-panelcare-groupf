import { RegistryScreen } from "@/features/registry/registry-screen";

export default async function Page({ params }: { params: Promise<{ parts?: string[] }> }) {
  const { parts = [] } = await params;
  return <RegistryScreen key={parts.join("/")} area="systems" parts={parts} />;
}
