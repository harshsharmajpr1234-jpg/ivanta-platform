import { PolicyPage } from '@/components/layout/policy-page';

export const metadata = { title: 'Privacy Policy — iVanta' };

export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy Policy" updated="September 2026">
      <section>
        <h2>1. What we collect</h2>
        <p>We collect the information you give us: your name, email address and/or mobile number for sign-in and OTP verification; delivery addresses; order and payment details; wishlist and review content; and support communications. Our servers also record technical data needed to operate the platform securely — session cookies, request logs and audit logs of account and order actions.</p>
      </section>
      <section>
        <h2>2. Why we use it</h2>
        <ul>
          <li>To process and deliver your orders, including payment verification with our payment provider.</li>
          <li>To check serviceability for your PIN code and compute delivery charges and ETAs.</li>
          <li>To send transactional notifications about your orders, shipments, returns and refunds (email, SMS, WhatsApp or push, as configured).</li>
          <li>To operate your account, wishlist, reviews and return requests.</li>
          <li>To prevent fraud, abuse and manipulation of prices, stock, coupons or payments, and to comply with legal obligations.</li>
        </ul>
      </section>
      <section>
        <h2>3. Payments</h2>
        <p>Card numbers, UPI credentials and netbanking secrets are never stored on our systems. Payments are processed by our payment provider; we retain only the payment reference, method, amount, status and provider transaction identifiers needed for verification, refunds and reconciliation.</p>
      </section>
      <section>
        <h2>4. Cookies and sessions</h2>
        <p>We use HTTP-only session cookies to keep you signed in and to maintain your cart. These cookies are not readable by third-party scripts. We do not run cross-site advertising trackers.</p>
      </section>
      <section>
        <h2>5. Sharing</h2>
        <p>We share data only with parties required to fulfil your order: courier partners (name, address, phone for delivery), the payment provider (transaction data), and notification providers (contact details for messages). We do not sell your personal data. Disclosures required by law are made only to the extent legally mandated.</p>
      </section>
      <section>
        <h2>6. Retention</h2>
        <p>Order, payment, refund and audit records are retained as required for accounting, tax and consumer-protection law, and are never hard-deleted. Account data is retained while your account is active; you may request deletion, subject to statutory retention of transaction records.</p>
      </section>
      <section>
        <h2>7. Your rights</h2>
        <p>You may access and correct your profile and addresses from your account, and contact us to request export, correction or deletion of your personal data, or to opt out of marketing communications. Write to care@ivanta.in. Grievances are handled per the Information Technology Act, 2000 and the DPDP Act, 2023; our grievance officer responds within statutory timelines.</p>
      </section>
      <section>
        <h2>8. Security</h2>
        <p>Passwords are stored only as salted hashes (BCrypt). Sessions expire automatically, repeated failed sign-ins are locked out, and requests are rate-limited. Access to personal data within iVanta is role-restricted and every administrative action is audit-logged.</p>
      </section>
      <section>
        <h2>9. Children</h2>
        <p>The platform is intended for adults. We do not knowingly collect data from minors; orders require a valid payment method and delivery address.</p>
      </section>
      <section>
        <h2>10. Changes</h2>
        <p>Material changes to this policy will be announced on this page with an updated revision date. Continued use after changes constitutes acceptance.</p>
      </section>
    </PolicyPage>
  );
}
