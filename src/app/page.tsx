import { redirect } from "next/navigation";

/** `/` has no content of its own: the sign-in page sends a signed-in tab on to its role home. */
export default function Home() {
  redirect("/login");
}
