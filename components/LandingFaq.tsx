import { FAQ_ITEMS } from "@/lib/landing-content";

export default function LandingFaq() {
  return (
    <section id="faq" className="py-20 md:py-28" style={{ background: "rgba(7,8,9,0.55)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="font-semibold text-sm uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: "#F0E8D8" }}>
            Dubai Property ROI: Common Questions
          </h2>
          <p style={{ color: "rgba(232,220,200,0.5)" }}>
            Everything you need to know about our free Dubai real estate ROI calculator and rental data.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="glass-card group"
              style={{ borderColor: "rgba(201,168,76,0.15)" }}
            >
              <summary
                className="cursor-pointer list-none px-5 py-4 font-semibold text-sm md:text-base flex justify-between items-center gap-4"
                style={{ color: "#F0E8D8" }}
              >
                {item.q}
                <span
                  className="shrink-0 text-lg transition-transform group-open:rotate-45"
                  style={{ color: "var(--gold)" }}
                >
                  +
                </span>
              </summary>
              <p
                className="px-5 pb-5 text-sm leading-relaxed"
                style={{ color: "rgba(232,220,200,0.6)" }}
              >
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
