import { PolicyPage } from '@/components/layout/policy-page';

export const metadata = { title: 'Terms of Service — iVanta' };

export default function TermsPage() {
  return (
    <PolicyPage title="Terms of Service" updated="September 2026">
      <section>
        <h2>1. What iVanta is</h2>
        <p>iVanta is an online retail platform selling genuine Apple products — iPhones, Macs, MacBooks, iPads, Apple Watches, AirPods and accessories — to customers in India. By browsing, ordering or using an account on ivanta.in you agree to these terms.</p>
      </section>
      <section>
        <h2>2. Your account</h2>
        <p>Accounts are created with OTP-verified email or mobile sign-in, or with a password. You must provide accurate information and keep your credentials confidential. You are responsible for all orders placed under your account. Sessions use HTTP-only cookies and expire automatically; suspected abuse may result in account suspension.</p>
      </section>
      <section>
        <h2>3. Products, pricing and availability</h2>
        <p>Product details, prices and stock shown on the site are served live from our catalog. All prices are in Indian Rupees and inclusive of applicable taxes unless stated otherwise. Prices and availability can change without notice; the binding price is the one computed by our servers and shown in your order confirmation at checkout. We may refuse or cancel orders arising from pricing errors, suspected fraud or stock unavailability, with a full refund for any amount captured.</p>
      </section>
      <section>
        <h2>4. Orders and payment</h2>
        <p>An order is placed when you complete checkout. Online payments (UPI, cards, netbanking, wallets) are verified server-side with our payment provider before the order is confirmed; Cash on Delivery is available on eligible orders and PIN codes. Stock for your order is reserved for a short window while you check out — if the reservation lapses, items may need to be re-added. Minimum order value applies to Cash on Delivery.</p>
      </section>
      <section>
        <h2>5. Shipping and delivery</h2>
        <p>We ship to serviceable PIN codes across India. Delivery timelines shown at checkout are estimates from our courier partners and can vary by location. You can track every shipment from your order page. Risk in the goods passes to you on delivery; please inspect the package at handover where possible and report damage immediately through your order page.</p>
      </section>
      <section>
        <h2>6. Returns, refunds and warranty</h2>
        <p>Returns are accepted within the published return window from delivery, subject to the conditions in our Refund Policy. Refunds are issued to the original payment method, or via bank transfer for COD orders. Product warranty is provided by Apple India per its standard terms; iVanta facilitates but does not replace manufacturer warranty obligations.</p>
      </section>
      <section>
        <h2>7. Coupons and promotions</h2>
        <p>Coupons are validated on our servers against their published conditions — minimum order value, applicable products or categories, usage limits and validity dates. We may withdraw or modify promotions at any time. Coupons cannot be exchanged for cash.</p>
      </section>
      <section>
        <h2>8. Prohibited use</h2>
        <p>You agree not to attempt to manipulate prices, stock, coupons, payment verification or order statuses; to probe, scan or test the vulnerability of the platform; to resell products in violation of applicable law; or to use the platform for any unlawful purpose. Violations may lead to order cancellation, account termination and legal action.</p>
      </section>
      <section>
        <h2>9. Liability</h2>
        <p>To the maximum extent permitted by law, iVanta&apos;s aggregate liability for any order is limited to the amount paid for that order. Nothing in these terms limits liability that cannot be limited under Indian law, including for fraud or death or personal injury caused by negligence.</p>
      </section>
      <section>
        <h2>10. Governing law</h2>
        <p>These terms are governed by the laws of India. Courts at Jaipur, Rajasthan have exclusive jurisdiction. Questions: care@ivanta.in.</p>
      </section>
    </PolicyPage>
  );
}
