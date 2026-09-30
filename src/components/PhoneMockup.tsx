import Image from "next/image";
import Link from "next/link";
// The README screenshot without the site header (regenerate with
// docs/social-card.html, then docs/demo-feed-bare.html).
import demoFeed from "@/docs/demo-feed-bare.png";

// The demo feed in a CSS phone frame. The frame crops the tall screenshot to
// its top, and the whole phone links to the live demo.
export default function PhoneMockup() {
  return (
    <Link
      href="/demo"
      className="block w-[240px] shrink-0 md:w-[300px]"
      aria-label="Open the demo feed"
    >
      {/* The frame is a ring, drawn outside the screen so it takes no width
          from the screenshot (m-1.5 leaves room for it). pt-6 is the status
          bar strip: it keeps the screenshot's header clear of the rounded
          corners. */}
      {/* Shorter on phones, where it fades out above the headline. */}
      <div className="m-1.5 aspect-[8/11] overflow-hidden md:aspect-[9/17] rounded-[2.25rem] bg-white pt-6 shadow-2xl ring-6 ring-gray-900">
        <Image
          src={demoFeed}
          alt="The CIGINT feed on a phone: 0.61 cigarettes over the last 30 days, then a smoky ride in Kelowna with an AQHI of 9, high risk, and a run in Vancouver at low risk."
          sizes="300px"
          preload
          className="h-auto w-full"
        />
      </div>
    </Link>
  );
}
