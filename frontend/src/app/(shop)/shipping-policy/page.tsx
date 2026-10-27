import { PolicyPage } from '@/components/layout/policy-page';

export const metadata = { title: 'Shipping Policy — FlyPhones' };

export default function ShippingPolicyPage() {
  return (
    <PolicyPage title="Shipping Policy" updated="September 2026">
      <section>
        <h2>1. Where we ship</h2>
        <p>We ship across India to all serviceable PIN codes. Before you pay, checkout verifies serviceability for your delivery PIN code in real time and shows the available shipping methods, delivery charge and estimated delivery window for your address. If a PIN code is not serviceable, the reason is shown and no order can be placed to that address.</p>
      </section>
      <section>
        <h2>2. Shipping methods and charges</h2>
        <ul>
          <li><strong>Standard</strong> — base delivery charge, waived on orders above ₹999.</li>
          <li><strong>Express</strong> — faster delivery where available, at a published fee.</li>
          <li><strong>Same-Day</strong> — in select metro PIN codes, at a published fee.</li>
        </ul>
        <p>Zone-based surcharges may apply for remote locations; the exact charge for your address is always computed by our servers and displayed before payment.</p>
      </section>
      <section>
        <h2>3. Processing and dispatch</h2>
        <p>Prepaid orders are processed once payment is verified; Cash on Delivery orders are processed on confirmation. Items are reserved for you while you check out (typically 15 minutes) so stock cannot be oversold. In-stock orders are generally packed and handed to the courier within 24–48 working hours; the order timeline on your order page shows each step with timestamps.</p>
      </section>
      <section>
        <h2>4. Tracking</h2>
        <p>Every shipment carries tracking events — picked up, in transit, out for delivery, delivered — visible on your order page and sent as notifications. Delivered orders record the delivery time for return-window and warranty purposes.</p>
      </section>
      <section>
        <h2>5. Delivery attempts and failures</h2>
        <p>Couriers typically attempt delivery up to two times. If an order cannot be delivered (wrong address, unreachable customer, refusal at door), it is returned to us and any captured amount is refunded in full to the original payment method within the timelines in our Refund Policy.</p>
      </section>
      <section>
        <h2>6. Open Box Delivery & Inspection at Handover</h2>
        <p>All pre-owned Apple devices are shipped under our <strong>Open Box Delivery</strong> program. The delivery executive opens the outer parcel in your presence so you can verify the device model, physical condition, and included cable/accessories before handover (and before COD payment if applicable). If any physical damage or discrepancy is seen, you can refuse the parcel on the spot. Once accepted, internal hardware testing is covered under the 3-Day Testing Window.</p>
      </section>
      <section>
        <h2>7. Delays and force majeure</h2>
        <p>Delivery estimates are courier-provided and may vary by location, weather, strikes or other events beyond our control. If a delay is material, you may cancel an unshipped order at any time from the order page for a full refund.</p>
      </section>
    </PolicyPage>
  );
}
