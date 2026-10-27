import Link from 'next/link';
import { PolicyPage } from '@/components/layout/policy-page';
import { BRAND } from '@/constants';

export const metadata = { title: `Terms of Service — ${BRAND.name}` };

export default function TermsPage() {
  return (
    <PolicyPage title="Terms of Service" updated="October 2026">
      <section>
        <h2>1. About Flyphones & Legal Attribution</h2>
        <p>
          Flyphones is an online e-commerce platform operated in association with <strong>{BRAND.parentCompany}</strong>, offering quality-tested refurbished and pre-owned smartphones and related consumer electronics to customers in India. By browsing, purchasing, or registering an account on flyphones.in you agree to these Terms of Service.
        </p>
      </section>

      <section>
        <h2>2. User Accounts & Security</h2>
        <p>
          Accounts are authenticated via OTP-verified mobile/email credentials or encrypted password authentication. You agree to provide accurate registration details and maintain the security of your credentials. Sessions utilize secure HTTP-only cookie protocols.
        </p>
      </section>

      <section>
        <h2>3. Catalog, Pricing & Stock Reservation</h2>
        <p>
          All product details, specifications, condition grades (Grade A, B, and C), and real-time inventory counts are verified live by our servers. All prices are in Indian Rupees (₹) inclusive of applicable taxes. Prices and discounts are calculated and validated server-side.
        </p>
      </section>

      <section>
        <h2>4. Orders & Payment Processing</h2>
        <p>
          Orders are placed upon completing checkout. Online transactions (UPI, credit/debit cards, net banking, digital wallets) are cryptographically verified by our payment gateway providers prior to confirmation. Cash on Delivery (COD) is available on eligible PIN codes and order limits.
        </p>
      </section>

      <section>
        <h2>5. Shipping, Open Box Delivery & Transit Risk</h2>
        <p>
          We deliver to serviceable PIN codes across India via verified logistics partners. Customers are entitled to Open Box Delivery inspection at their doorstep. Any physical transit damage or cosmetic discrepancy must be reported within 24 hours of delivery accompanied by an unboxing video.
        </p>
      </section>

      <section>
        <h2>6. Warranty & Return Commitments</h2>
        <p>
          Refurbished devices carry an official <strong>six (06) months limited warranty</strong> commencing from the invoice date, and supplied accessories hold a <strong>three (03) months warranty</strong>. Claims require matching device IMEI/serial validation, intact internal security seals, and compliance with our{' '}
          <Link href="/warranty-policy" className="font-semibold text-accent underline">
            Warranty & Return Policy
          </Link>{' '}
          and{' '}
          <Link href="/condition-guide" className="font-semibold text-accent underline">
            Device Condition Guide
          </Link>.
        </p>
      </section>

      <section>
        <h2>7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable Indian law, Flyphones and {BRAND.parentCompany}&apos;s aggregate liability for any transaction is strictly limited to the amount paid for that specific order.
        </p>
      </section>

      <section>
        <h2>8. Governing Law & Jurisdiction</h2>
        <p>
          These terms and all transactions are governed by the laws of India. Courts at New Delhi, Delhi shall have jurisdiction. For inquiries, write to {BRAND.supportEmail} or call {BRAND.supportPhone}.
        </p>
      </section>
    </PolicyPage>
  );
}
