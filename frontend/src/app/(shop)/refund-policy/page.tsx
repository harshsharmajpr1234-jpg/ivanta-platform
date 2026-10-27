import { PolicyPage } from '@/components/layout/policy-page';

export const metadata = { title: 'Refund & Return Policy — FlyPhones' };

export default function RefundPolicyPage() {
  return (
    <PolicyPage title="Refund & Return Policy" updated="September 2026">
      <section>
        <h2>1. 3-Day Testing & Replacement Window</h2>
        <p>All items on FlyPhones are independently quality-checked pre-owned Apple devices. Every order comes with <strong>Open Box Delivery</strong> and a strict <strong>3-Day Testing Window</strong> starting from the timestamp of delivery. You can thoroughly test all hardware and software features of the device. If any hardware defect or functionality issue arises within these 3 days, you can raise a free replacement request directly from your Account → Orders page.</p>
      </section>
      <section>
        <h2>2. Open Box Delivery & Eligibility</h2>
        <ul>
          <li><strong>Open Box Delivery</strong>: Inspect the physical condition of the device right in front of the delivery courier before accepting. Any external physical damage or missing accessories must be noted at the time of delivery.</li>
          <li><strong>Internal Hardware Faults</strong>: Display, camera, Face ID, speaker, microphone, or battery issues discovered within the 3-day testing period qualify for immediate free replacement or return.</li>
          <li>Devices must be returned with their original accessories and packaging as dispatched, and must be free from any personal Apple ID / iCloud lock.</li>
        </ul>
      </section>
      <section>
        <h2>3. The return & replacement process</h2>
        <p>Requested → Approved → Pickup scheduled → Received → Inspecting → Replacement dispatched / Refund processed. Each transition is timestamped and shown on your account page. Serial / IMEI numbers are verified upon pickup.</p>
      </section>
      <section>
        <h2>4. Refund amounts</h2>
        <p>Refunds cover the item price, its tax share and a pro-rated share of any order-level coupon discount, exactly as computed by our servers — never more than what was actually paid. Shipping charges are refunded for damaged/defective/wrong deliveries or full-order returns; for partial change-of-mind returns, shipping may not be refundable. The itemised breakdown is shown on each return.</p>
      </section>
      <section>
        <h2>5. How refunds are issued</h2>
        <ul>
          <li><strong>Online payments (UPI, cards, netbanking, wallets)</strong> — refunded to the original payment method. Banks/UPI typically reflect refunds within 3–7 working days of processing; card refunds can take up to 7–10 working days depending on the issuer.</li>
          <li><strong>Cash on Delivery</strong> — refunded via bank transfer (NEFT/IMPS) to the account you provide during the return.</li>
        </ul>
        <p>Every refund is provider-confirmed and carries a reference ID visible on the return page.</p>
      </section>
      <section>
        <h2>6. Cancellations</h2>
        <p>Orders can be cancelled from the order page until they ship. Prepaid cancellations are refunded in full to the original payment method with the timelines above. COD cancellations require no refund.</p>
      </section>
      <section>
        <h2>7. 1-Month Hardware Warranty (Post-3-Day Coverage)</h2>
        <p>All pre-owned Apple devices come with a <strong>3-Day Instant Replacement Window</strong> followed by a <strong>1-Month (30 days from delivery) FlyPhones Hardware Warranty</strong>. This covers internal hardware malfunctions (display, camera, Face ID, motherboard, speaker) not caused by physical drops, liquid/water damage, or unauthorized tampering. Once the 1-month warranty period expires, the company bears no further warranty, liability, or role.</p>
      </section>
      <section>
        <h2>8. Fraud prevention</h2>
        <p>Returns are inspected before refunds are released. Serialised items are matched against the dispatched unit. Fraudulent returns (swapped, tampered or non-purchased items) are rejected and may be reported to law enforcement.</p>
      </section>
      <section>
        <h2>9. Contact</h2>
        <p>Refund status not updating or money not received within the timelines above? Write to support@flyphones.in with your order ID — we reconcile against payment provider records and respond within 2 working days.</p>
      </section>
    </PolicyPage>
  );
}
