import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "How CIGINT turns air quality data into an AQHI reading and a cigarette equivalent, and where the numbers fall short.",
};

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline"
    >
      {children}
    </a>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <p className="overflow-x-auto rounded-md bg-gray-50 p-3 font-mono text-sm text-gray-800">
      {children}
    </p>
  );
}

const AQHI_BANDS = [
  { range: "1–3", risk: "Low", style: "bg-sky-50 text-sky-900" },
  { range: "4–6", risk: "Moderate", style: "bg-amber-50 text-amber-900" },
  { range: "7–10", risk: "High", style: "bg-orange-100 text-orange-900" },
  { range: "10+", risk: "Very high", style: "bg-red-100 text-red-900" },
];

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6 text-gray-700">
      <h1 className="text-2xl font-bold text-gray-900">About CIGINT</h1>
      <p>
        CIGINT estimates how much air pollution you breathed on your outdoor
        Strava activities, and expresses the fine particle part of it as a
        number of cigarettes. It&apos;s a rough, fun estimate built on real
        public data. Here&apos;s how each number is made, and where it falls
        short.
      </p>

      <h2 className="text-lg font-semibold text-gray-900">The short version</h2>
      <p>For each outdoor activity with GPS, CIGINT:</p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>takes the place and time your activity started;</li>
        <li>
          looks up the air quality there from Environment and Climate Change
          Canada, averaged over the 3 hours up to the start;
        </li>
        <li>works out the Air Quality Health Index (AQHI);</li>
        <li>
          turns the fine particles you were exposed to, over the time you were
          out, into a cigarette equivalent.
        </li>
      </ol>

      <h2 className="text-lg font-semibold text-gray-900">
        Where the air quality comes from
      </h2>
      <p>
        Every hour, Environment and Climate Change Canada (ECCC) combines its
        air quality forecast model with measurements from monitoring stations
        across Canada and the United States. The result is its{" "}
        <ExternalLink href="https://eccc-msc.github.io/open-data/msc-data/nwp_rdaqa/readme_rdaqa_en/">
          Regional Deterministic Air Quality Analysis
        </ExternalLink>
        : a map of pollution near the ground, in squares about 10 km across.
        It covers Canada (apart from the high Arctic), the contiguous United
        States (apart from the southern tip of Texas and the Florida Keys) and
        most of Alaska.
      </p>
      <p>CIGINT reads the square nearest your start for three pollutants:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>PM2.5</strong>: fine particles from smoke, exhaust and dust,
          small enough to reach deep into the lungs;
        </li>
        <li>
          <strong>NO₂</strong>: nitrogen dioxide, mostly from traffic and
          burning fuel;
        </li>
        <li>
          <strong>O₃</strong>: ground-level ozone, formed in sunlight from
          other pollutants.
        </li>
      </ul>
      <p>
        ECCC publishes each hour twice. A preliminary analysis appears within
        about an hour, before every station has reported, and the final one
        follows about two hours after the hour. CIGINT shows the preliminary
        reading straight away, marks it <em>Preliminary</em>, and swaps in
        the final one once it&apos;s out. ECCC keeps these files online for
        about a month, which is why CIGINT covers roughly your last 30 days.
      </p>

      <h2 className="text-lg font-semibold text-gray-900">
        The Air Quality Health Index
      </h2>
      <p>
        The AQHI is Canada&apos;s health-based air quality scale. Health
        Canada researchers built it from studies of how daily deaths rise with
        pollution (Stieb et al., 2008). Each pollutant&apos;s contribution is
        added up, so moderate levels of all three count for more than any one
        alone. The formula uses 3-hour averages, with NO₂ and O₃ in parts per
        billion and PM2.5 in µg/m³:
      </p>
      <Formula>
        AQHI = (1000 ÷ 10.4) × [(e^(0.000871 × NO₂) − 1) + (e^(0.000537 × O₃)
        − 1) + (e^(0.000487 × PM2.5) − 1)]
      </Formula>
      <p>
        It&apos;s shown as a whole number from 1 up, with anything over 10
        shown as 10+, in the{" "}
        <ExternalLink href="https://www.canada.ca/en/environment-climate-change/services/air-quality-health-index/about.html">
          official risk bands
        </ExternalLink>
        :
      </p>
      <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {AQHI_BANDS.map((band) => (
          <li key={band.risk} className={`rounded-md p-3 ${band.style}`}>
            <span className="block text-xl font-bold">{band.range}</span>
            {band.risk} risk
          </li>
        ))}
      </ul>
      <p>
        <strong>How close is it to the official AQHI?</strong> Official values
        come from monitoring stations, while CIGINT computes its own from the
        10 km map. We compared the two for 216 station-hours in British
        Columbia during two wildfire smoke events. They were 0.29 apart on
        average, and in the same risk band 97% of the time. Very few of those
        hours were high, though, and a 10 km square smooths out local peaks,
        so <strong>CIGINT probably reads low in heavy smoke</strong>.
      </p>

      <h2 className="text-lg font-semibold text-gray-900">
        The cigarette equivalent
      </h2>
      <p>
        The cigarette number comes from a rule of thumb by Richard and
        Elizabeth Muller of{" "}
        <ExternalLink href="https://berkeleyearth.org/air-pollution-and-cigarette-equivalence/">
          Berkeley Earth
        </ExternalLink>
        : breathing air with 22 µg/m³ of PM2.5 for a day carries roughly the
        same health risk as smoking one cigarette.
      </p>
      <p>
        They got there by comparing deaths, not the amount of smoke inhaled.
        In the US, smoking causes about 480,000 deaths a year from roughly 350
        billion cigarettes, or about one death per 730,000 cigarettes. In
        China, fine particle pollution was estimated to cause 1.6 million
        deaths a year at an average of 52 µg/m³. That&apos;s the same toll as
        about 2.4 cigarettes per person per day, and 52 ÷ 2.4 ≈ 22.
      </p>
      <p>CIGINT scales that to the time you were out:</p>
      <Formula>cigarettes = PM2.5 × hours outside ÷ (22 × 24)</Formula>
      <p>
        So an hour at 22 µg/m³ counts as 1/24 of a cigarette. Hours outside
        is the activity&apos;s elapsed time, stops included, because you&apos;re
        still breathing that air at a red light. The exception is activities
        that were mostly standing around: if elapsed time is more than 1.5
        times moving time, moving time is used instead.
      </p>
      <p>Please read this number loosely:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          The Mullers call it a rough estimate, meant to give a feel for the
          health effects, not a medical figure.
        </li>
        <li>
          It compares health risk, not the weight of particles. Measured by
          weight, the equivalent would be about ten times lower.
        </li>
        <li>
          It was worked out for a whole day of exposure. Applying it to an
          hour-long run is CIGINT&apos;s own simplification.
        </li>
        <li>It only counts PM2.5. The AQHI also covers NO₂ and ozone.</li>
      </ul>

      <h2 className="text-lg font-semibold text-gray-900">Place names</h2>
      <p>
        The place under each activity comes from{" "}
        <ExternalLink href="https://www.openstreetmap.org/copyright">
          OpenStreetMap
        </ExternalLink>
        , looked up once from the start point and then saved. Activities that
        start within about 100 m of each other share a name, so we ask as
        rarely as possible.
      </p>

      <h2 className="text-lg font-semibold text-gray-900">
        What CIGINT doesn&apos;t account for
      </h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Your route.</strong> Air quality is read at the start only.
          A long ride that climbs out of a smoky valley gets the valley&apos;s
          reading.
        </li>
        <li>
          <strong>Timing.</strong> The reading covers the 3 hours up to your
          start, not the hours you were actually out.
        </li>
        <li>
          <strong>How hard you were breathing.</strong> Exercise makes you
          breathe more, and take in more pollution with it (Koehle, 2024). A
          sprint and a stroll count the same here, so for hard efforts the
          real dose is probably higher.
        </li>
        <li>
          <strong>Local sources.</strong> A 10 km square can&apos;t see the bus
          you ran behind or the campfire you passed.
        </li>
        <li>
          <strong>You.</strong> Health effects depend on age, fitness and
          health conditions. This isn&apos;t medical advice. For real
          decisions, check the official AQHI and forecasts.
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-gray-900">Sources</h2>
      <ul className="list-disc space-y-2 pl-5 text-sm">
        <li>
          Muller, R. A. &amp; Muller, E. A. (2015, updated 2023).{" "}
          <ExternalLink href="https://berkeleyearth.org/air-pollution-and-cigarette-equivalence/">
            Air pollution and cigarette equivalence
          </ExternalLink>
          . Berkeley Earth.
        </li>
        <li>
          Stieb, D. M., Burnett, R. T., Smith-Doiron, M., Brion, O., Shin, H.
          H. &amp; Economou, V. (2008). A new multipollutant, no-threshold air
          quality health index based on short-term associations observed in
          daily time-series analyses.{" "}
          <em>Journal of the Air &amp; Waste Management Association</em>,
          58(3), 435–450.{" "}
          <ExternalLink href="https://doi.org/10.3155/1047-3289.58.3.435">
            doi:10.3155/1047-3289.58.3.435
          </ExternalLink>
        </li>
        <li>
          Government of Canada.{" "}
          <ExternalLink href="https://www.canada.ca/en/environment-climate-change/services/air-quality-health-index/about.html">
            About the Air Quality Health Index
          </ExternalLink>
          .
        </li>
        <li>
          Environment and Climate Change Canada, Meteorological Service of
          Canada.{" "}
          <ExternalLink href="https://eccc-msc.github.io/open-data/msc-data/nwp_rdaqa/readme_rdaqa_en/">
            Regional Deterministic Air Quality Analysis (RDAQA)
          </ExternalLink>
          . MSC Open Data.
        </li>
        <li>
          Hasselback, P. &amp; Taylor, E. (2010).{" "}
          <ExternalLink href="https://www2.gov.bc.ca/assets/gov/environment/air-land-water/air/reports-pub/aqhi-variation-bc.pdf">
            Air Quality Health Index variation across British Columbia
          </ExternalLink>
          . BC Ministry of Healthy Living and Sport.
        </li>
        <li>
          Koehle, M. S. (2024). Physiological impacts of atmospheric
          pollution: Effects of environmental air pollution on exercise.{" "}
          <em>Physiological Reports</em>, 12(7), e16005.{" "}
          <ExternalLink href="https://doi.org/10.14814/phy2.16005">
            doi:10.14814/phy2.16005
          </ExternalLink>
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-gray-900">
        Data licences and credits
      </h2>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        <li>
          <strong>Air quality:</strong> Data Source: Environment and Climate
          Change Canada, used under the{" "}
          <ExternalLink href="https://eccc-msc.github.io/open-data/licence/readme_en/">
            ECCC Data Servers End-use Licence
          </ExternalLink>
          .
        </li>
        <li>
          <strong>Place names:</strong> ©{" "}
          <ExternalLink href="https://www.openstreetmap.org/copyright">
            OpenStreetMap contributors
          </ExternalLink>
          , available under the Open Database Licence, via Nominatim.
        </li>
        <li>
          <strong>Activities:</strong> Powered by Strava.
        </li>
      </ul>
      <p className="text-sm">
        CIGINT isn&apos;t affiliated with or endorsed by Strava or Environment
        and Climate Change Canada. See the{" "}
        <Link href="/privacy" className="underline">
          privacy page
        </Link>{" "}
        for what we store, or try the{" "}
        <Link href="/demo" className="underline">
          demo feed
        </Link>
        .
      </p>
    </main>
  );
}
