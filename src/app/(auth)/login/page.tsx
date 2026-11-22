import type { Metadata } from "next";
import { MockSignIn } from "./mock-sign-in";

export const metadata: Metadata = { title: "Sign in (mock) · PanelCare" };

export default function LoginPage() {
  return <MockSignIn />;
}
