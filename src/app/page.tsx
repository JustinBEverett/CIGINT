export const dynamic = "force-dynamic";
import { getSession } from "../lib/session";

export default async function Home() {
  const strava = await getSession();
  console.log(await strava?.athlete.get());

  return <main className="shell"></main>;
}
