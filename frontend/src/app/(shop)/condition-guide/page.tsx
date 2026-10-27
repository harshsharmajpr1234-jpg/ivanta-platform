import Link from 'next/link';
import { Check, ShieldCheck, Info, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';
import { CONDITION_GRADES, BRAND } from '@/constants';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Device Condition Guide — Grading Standards',
  description: 'Learn about Flyphones grading standards: A Grade (Superb), B Grade (Good), and C Grade (Fair). 100% functionally tested pre-owned devices.',
};

export default function ConditionGuidePage() {
  const grades = [CONDITION_GRADES.A, CONDITION_GRADES.B, CONDITION_GRADES.C];

  return (
    <div className="bg-surface py-8 sm:py-14">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-sunk px-3.5 py-1 text-[11px] font-semibold text-ink">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Grading Standards · {BRAND.name}
          </span>
          <h1 className="mt-3.5 text-[28px] font-extrabold tracking-tight text-ink sm:text-[38px]">
            Device Condition Guide
          </h1>
          <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-ink-muted sm:text-[15.5px]">
            Every refurbished and pre-owned device sold by {BRAND.name} is thoroughly tested for 100% functional performance. We grade our devices transparently into three physical condition tiers so you know exactly what to expect.
          </p>
        </div>

        {/* Grade Cards */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {grades.map((g) => (
            <div
              key={g.grade}
              className="relative flex flex-col rounded-3xl border border-line bg-white p-6 shadow-soft transition-all hover:shadow-pop"
            >
              <div className="flex items-center justify-between border-b border-line/70 pb-4">
                <div>
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-ink-faint">Tier {g.grade}</span>
                  <h2 className="text-[18px] font-extrabold text-ink">{g.label}</h2>
                </div>
                <Badge tone={g.badgeTone}>Grade {g.grade}</Badge>
              </div>

              <p className="mt-3.5 text-[13px] leading-relaxed text-ink-muted">
                {g.summary}
              </p>

              <div className="mt-5 space-y-4 flex-1">
                <div className="rounded-xl bg-surface-sunk/60 p-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Functional Quality</span>
                  <p className="mt-0.5 text-[13px] font-semibold text-emerald-600 flex items-center gap-1.5">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" /> {g.functional}
                  </p>
                </div>

                <div>
                  <span className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-faint">Display</span>
                  <p className="mt-0.5 text-[13px] text-ink">{g.display}</p>
                </div>

                <div>
                  <span className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-faint">Display Glass</span>
                  <p className="mt-0.5 text-[13px] text-ink">{g.displayGlass}</p>
                </div>

                <div>
                  <span className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-faint">Body & Physical Condition</span>
                  <p className="mt-0.5 text-[13px] text-ink">{g.bodyCondition}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-line/60">
                <Link
                  href="/products"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-surface-sunk py-2 text-[12.5px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
                >
                  View Grade {g.grade} Devices <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Comparison Table */}
        <div className="mt-14 overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
          <div className="border-b border-line bg-surface-sunk/50 px-6 py-4">
            <h3 className="text-[16px] font-bold text-ink">Side-by-Side Grading Comparison Matrix</h3>
            <p className="text-[12.5px] text-ink-muted">Direct technical parameters across all three grading categories</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-line bg-surface-sunk/30 text-[11.5px] font-semibold uppercase tracking-wider text-ink-faint">
                <tr>
                  <th className="py-3 px-6">Criteria</th>
                  <th className="py-3 px-6">Grade A (Superb)</th>
                  <th className="py-3 px-6">Grade B (Good)</th>
                  <th className="py-3 px-6">Grade C (Fair)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-ink">Functional Status</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-medium">100% Tested & Functional</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-medium">100% Tested & Functional</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-medium">100% Tested & Functional</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-ink">Display Panel</td>
                  <td className="py-3.5 px-6 text-ink">Perfect condition, no dead pixels</td>
                  <td className="py-3.5 px-6 text-ink">Minor pixel dot, no visibility issue</td>
                  <td className="py-3.5 px-6 text-ink">3–4 minor pixel dots/shade, no visibility issue</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-ink">Display Glass</td>
                  <td className="py-3.5 px-6 text-ink">Minimal scratches barely visible</td>
                  <td className="py-3.5 px-6 text-ink">Approx. 4–5 minor scratches</td>
                  <td className="py-3.5 px-6 text-ink">Approx. 7–8 minor scratches</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-ink">Body & Enclosure</td>
                  <td className="py-3.5 px-6 text-ink">Few hairline signs of usage</td>
                  <td className="py-3.5 px-6 text-ink">Minor dents or scratches</td>
                  <td className="py-3.5 px-6 text-ink">5–8 minor dents and scratches</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-ink">Warranty Protection</td>
                  <td className="py-3.5 px-6 text-ink font-medium">6 Months Limited Warranty</td>
                  <td className="py-3.5 px-6 text-ink font-medium">6 Months Limited Warranty</td>
                  <td className="py-3.5 px-6 text-ink font-medium">6 Months Limited Warranty</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Important Transparency Notice */}
        <div className="mt-8 rounded-2xl border border-line bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-[13px] text-ink-muted leading-relaxed">
              <strong className="font-semibold text-ink">Individual Device Variation Note:</strong> Because all units are independently pre-owned and refurbished, cosmetic signs of usage (such as micro-scratches or minor chassis markings) may vary slightly between individual serial numbers within the same grade. All devices remain 100% functional and are backed by our 6-month limited warranty and 24-hour unboxing video inspection policy.
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-white p-6 sm:p-8">
          <div>
            <h4 className="text-[17px] font-bold text-ink">Have questions regarding a specific device grade?</h4>
            <p className="mt-1 text-[13px] text-ink-muted">Our customer support team is available Mon–Sat, 10:00 AM – 7:00 PM via Call or WhatsApp.</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`tel:${BRAND.supportPhoneRaw}`}
              className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-5 text-[13px] font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              Call {BRAND.supportPhone}
            </a>
            <Link
              href="/warranty-policy"
              className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-surface-sunk px-5 text-[13px] font-semibold text-ink hover:bg-ink hover:text-white transition-colors"
            >
              Warranty Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
