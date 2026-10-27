import Link from 'next/link';
import { PolicyPage } from '@/components/layout/policy-page';
import { BRAND, WARRANTY_POLICY } from '@/constants';

export const metadata = { title: `Refund & Return Policy — ${BRAND.name}` };

export default function RefundPolicyPage() {
  return (
    <PolicyPage title="Refund & Return Policy" updated="October 2026">
      <div className="mb-6 rounded-2xl border border-line bg-surface-sunk/60 p-4 text-[13px] text-ink-muted">
        Looking for technical warranty rules or grading definitions? Read our comprehensive{' '}
        <Link href="/warranty-policy" className="font-semibold text-accent underline">
          Warranty & Return Policy
        </Link>{' '}
        and{' '}
        <Link href="/condition-guide" className="font-semibold text-accent underline">
          Device Condition Guide
        </Link>.
      </div>

      <section>
        <h2>1. Warranty Duration & Scope</h2>
        <p>
          Refurbished smartphones and consoles purchased from {BRAND.name} (Powered by {BRAND.parentCompany}) carry a{' '}
          <strong>six (06) months limited warranty</strong> commencing from the invoice date. Accessories provided with the product
          (including adaptor, data/charging cable, and battery) carry a <strong>three (03) months warranty</strong>.
        </p>
      </section>

      <section>
        <h2>2. Damage Reporting Within 24 Hours & Unboxing Video</h2>
        <p>
          Any physical damage, external cosmetic discrepancy, or condition mismatch must be reported within{' '}
          <strong>24 hours of delivery</strong> accompanied by a continuous un-cut unboxing video of the purchased package.
          Failure to report within 24 hours with an unboxing video will void cosmetic or transit damage claims.
        </p>
      </section>

      <section>
        <h2>3. IMEI Validation & Device Imaging</h2>
        <p>
          To establish warranty validity, customers must provide the matching IMEI or serial number shown on the invoice.
          Before packing the unit for pickup, customers must share clear front, side, and back photographs of the device and demonstrate reported issues via video if requested.
        </p>
      </section>

      <section>
        <h2>4. Internal Seal Integrity Requirement</h2>
        <p>
          The security seal inside the device must remain completely intact. If the seal is found broken, opened, or tampered with at the time of return inspection, the claim will be rejected and no resolution will be provided.
        </p>
      </section>

      <section>
        <h2>5. The Return & Replacement Process</h2>
        <p>
          Requested → Approved → Pickup scheduled → Received → Inspection → Resolution. During the warranty period, {BRAND.name} may repair or replace the device at its discretion. Any replacement device carries the residual warranty period of the original purchase.
        </p>
      </section>

      <section>
        <h2>6. Return Packaging & Transit Safety</h2>
        <p>
          Customers must pack return devices securely with adequate cushioning. {BRAND.name} reserves the right to deduct or recover costs for improper packaging resulting in physical transit damage.
        </p>
      </section>

      <section>
        <h2>7. Warranty Exclusions</h2>
        <ul>
          {WARRANTY_POLICY.exclusions.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>8. How Refunds Are Issued</h2>
        <ul>
          <li><strong>Online payments (UPI, cards, net banking, wallets)</strong> — refunded to original payment method within 3–7 working days of return approval.</li>
          <li><strong>Cash on Delivery (COD)</strong> — refunded via bank transfer (NEFT/IMPS) to customer-provided verified account details.</li>
        </ul>
      </section>

      <section>
        <h2>9. Customer Support Contact</h2>
        <p>
          For warranty claims, return tracking, or support assistance:
          <br />
          Calling Support: <a href={`tel:${BRAND.supportPhoneRaw}`} className="text-accent underline">{BRAND.supportPhone}</a>
          <br />
          WhatsApp Support: <a href={`https://wa.me/${BRAND.supportPhoneRaw}`} className="text-accent underline">{BRAND.supportPhone}</a>
          <br />
          Support Hours: {BRAND.supportHours}
          <br />
          Email: <span className="font-semibold text-ink">{BRAND.supportEmail}</span>
        </p>
      </section>
    </PolicyPage>
  );
}
