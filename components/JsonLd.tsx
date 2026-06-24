import { getSiteUrl } from "@/lib/site-url";
import { FAQ_ITEMS } from "@/lib/landing-content";

export default function JsonLd() {
  const url = getSiteUrl();

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: "Dubai ROI | Property Calculator",
        alternateName: "Dubai ROI Calculator",
        description:
          "Free Dubai real estate ROI calculator with real DLD sales and Ejari rental data.",
        inLanguage: "en-AE",
      },
      {
        "@type": "WebApplication",
        "@id": `${url}/#app`,
        name: "Dubai Real Estate ROI Calculator",
        url: `${url}/calculator`,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "AED",
        },
        description:
          "Free Dubai property ROI calculator. Gross yield, net yield, cash flow, mortgage analysis, and Dubai price estimations using DLD and Ejari data.",
        featureList: [
          "Free Dubai ROI calculator",
          "DLD sale price per sqft by area",
          "Ejari Dubai rental data",
          "Gross and net rental yield",
          "Property price estimation",
          "108 Dubai neighbourhoods",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${url}/#faq`,
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: "Dubai ROI",
        url,
        logo: `${url}/favicon.svg`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
