import Link from 'next/link';
import { PolicyPage } from '@/components/layout/policy-page';
import { BRAND } from '@/constants';

export const metadata = { title: `Shipping Policy — ${BRAND.name}` };

export default function ShippingPolicyPage() {
  return (
    <PolicyPage title="Shipping Policy" updated="October 2026">
      <section>
        <h2>1. Where we ship</h2>
        <p>We deliver across India to serviceable PIN codes via insured courier partners. Before you pay, checkout verifies serviceability for your 6-digit delivery PIN code in real time and computes exact delivery fees and estimated delivery windows.</p>
      </section>
      <section>
        <h2>2. Shipping methods and charges</h2>
        <ul>
          <li><strong>Standard Delivery</strong> — Base shipping, free on qualifying cart totals.</li>
          <li><strong>Express Delivery</strong> — Expedited priority air courier where available.</li>
        </ul>
        <p>Charges are calculated server-side and shown transparently before order placement.</p>
      </section>
      <section>
        <h2>3. Processing and dispatch</h2>
        <p>Orders are dispatched within 24–48 working hours from our Delhi fulfillment facility. Each shipment is tracked with real-time tracking events visible in your account.</p>
      </section>
      <section>
        <h2>4. Open Box Delivery & 24-Hour Damage Reporting</h2>
        <p>
          All mobile devices shipped by {BRAND.name} (Powered by {BRAND.parentCompany}) qualify for doorstep inspection. The delivery executive allows you to verify the physical exterior condition of the parcel before handover.
        </p>
        <p>
          <strong>Crucial Requirement:</strong> Any physical condition issues, transit damage, or grade discrepancies must be reported within <strong>24 hours of delivery</strong> accompanied by a continuous, un-cut unboxing video. Failure to report within 24 hours with an unboxing video will void physical damage claims.
        </p>
      </section>
      <section>
        <h2>5. Delivery Support</h2>
        <p>
          For questions on transit status:
          <br />
          Helpline: <a href={`tel:${BRAND.supportPhoneRaw}`} className="text-accent underline">{BRAND.supportPhone}</a> ({BRAND.supportHours})
          <br />
          WhatsApp: <a href={`https://wa.me/${BRAND.supportPhoneRaw}`} className="text-accent underline">{BRAND.supportPhone}</a>
          <br />
          Email: <span className="font-semibold text-ink">{BRAND.supportEmail}</span>
        </p>
      </section>
    </PolicyPage>
  );
}
