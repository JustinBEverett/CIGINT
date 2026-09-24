export const dynamic = "force-dynamic";
import { getSession } from "../lib/session";

export default async function Home() {
  const session = await getSession();

  // Placeholder — real homepage (connect CTA / feed link) lands in Step 4.
  return <main className="shell">{session ? "Connected" : "Not connected"}</main>;
}
