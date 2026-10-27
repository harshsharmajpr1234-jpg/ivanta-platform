package com.ivanta.invoice;

import com.ivanta.admin.SystemSettingRepository;
import com.ivanta.audit.AuditService;
import com.ivanta.auth.UserRepository;
import com.ivanta.common.exception.ResourceNotFoundException;
import com.ivanta.common.util.IdService;
import com.ivanta.delivery.DeliveryAddress;
import com.ivanta.delivery.DeliveryAddressRepository;
import com.ivanta.notification.NotificationService;
import com.ivanta.order.Order;
import com.ivanta.order.OrderDocument;
import com.ivanta.order.OrderDocumentRepository;
import com.ivanta.order.OrderItem;
import com.ivanta.order.OrderItemRepository;
import com.ivanta.order.OrderRepository;
import com.ivanta.payment.Payment;
import com.ivanta.payment.PaymentRepository;
import com.ivanta.storage.StorageProvider;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Year;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Invoice generation (§17): a real backend-rendered PDF (openhtmltopdf/PDFBox),
 * stored through the StorageProvider abstraction and recorded in invoices +
 * order_documents. Totals are snapshotted from the immutable order rows — the
 * invoice can never drift from what the customer actually paid. One invoice
 * per order; regeneration only happens if the stored PDF is unreadable.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a").withZone(ZoneId.systemDefault());

    private final InvoiceRepository invoices;
    private final OrderRepository orders;
    private final OrderItemRepository orderItems;
    private final DeliveryAddressRepository deliveryAddresses;
    private final PaymentRepository payments;
    private final OrderDocumentRepository documents;
    private final UserRepository users;
    private final SystemSettingRepository settings;
    private final StorageProvider storage;
    private final IdService ids;
    private final AuditService audit;
    private final NotificationService notifications;

    public record InvoicePdf(String invoiceNumber, String fileName, byte[] pdf) { }

    @Transactional
    public InvoicePdf getOrGenerate(String orderId, String actorId) {
        Order order = orders.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order " + orderId));

        Invoice existing = invoices.findByOrderId(orderId).orElse(null);
        if (existing != null) {
            try {
                byte[] pdf = storage.load(existing.getPdfKey());
                if (pdf != null && pdf.length > 0)
                    return new InvoicePdf(existing.getId(), fileName(existing.getId(), order), pdf);
            } catch (Exception e) {
                log.warn("Stored invoice {} unreadable, regenerating: {}", existing.getId(), e.getMessage());
            }
        }

        String number = ids.next("invoices", "INV-" + Year.now().getValue(), 6);
        byte[] pdf = render(order, number);
        String key = storage.store("invoices", number + ".pdf", pdf, "application/pdf");

        Invoice inv = new Invoice();
        inv.setId(number);
        inv.setOrderId(orderId);
        inv.setPdfKey(key);
        inv.setSubtotal(order.getSubtotal());
        inv.setDiscountTotal(order.getDiscountTotal());
        inv.setTaxTotal(order.getTaxTotal());
        inv.setShippingFee(order.getShippingFee());
        inv.setGrandTotal(order.getGrandTotal());
        inv.setPaymentMethod(order.getPaymentMethod());
        invoices.save(inv);

        OrderDocument doc = new OrderDocument();
        doc.setOrderId(orderId);
        doc.setDocType("INVOICE");
        doc.setStorageKey(key);
        doc.setFileName(fileName(number, order));
        doc.setMimeType("application/pdf");
        doc.setCreatedBy(actorId);
        documents.save(doc);

        audit.record("INVOICE_GENERATED", "invoice", number, null, "order=" + orderId);
        notifications.notifyUser(order.getUserId(), "INVOICE_READY",
                Map.of("invoiceNumber", number, "orderNumber", displayNumber(order)), "order", orderId);
        return new InvoicePdf(number, fileName(number, order), pdf);
    }

    private static String displayNumber(Order o) {
        return o.getOrderNumber() != null ? o.getOrderNumber() : o.getId();
    }

    private static String fileName(String invoiceNumber, Order o) {
        return "invoice-" + invoiceNumber + "-" + displayNumber(o) + ".pdf";
    }

    /* ---------- rendering ---------- */

    private byte[] render(Order o, String invoiceNumber) {
        List<OrderItem> items = orderItems.findByOrderId(o.getId());
        DeliveryAddress addr = deliveryAddresses.findByOrderId(o.getId()).orElse(null);
        String customer = users.findById(o.getUserId()).map(u -> u.getName()).orElse("Customer");
        String customerEmail = o.getContactEmail() != null ? o.getContactEmail()
                : users.findById(o.getUserId()).map(u -> u.getEmail()).orElse("");
        String customerPhone = o.getContactPhone() != null ? o.getContactPhone()
                : users.findById(o.getUserId()).map(u -> u.getPhone()).orElse("");
        Payment payment = payments.findFirstByOrderIdOrderByIdDesc(o.getId()).orElse(null);

        String sellerName = setting("warehouse.name", setting("invoice.seller_name", "Hansh Technologies (Flyphones)"));
        String sellerAddress = setting("invoice.seller_address", "510, Suneja Tower 2, District Center, Janakpuri West, New Delhi 110078, India");
        String sellerGstin = setting("seller.gstin", "07ABCDE1234F1Z5");
        String sellerState = setting("warehouse.state", "Delhi");

        boolean isIntraState = addr != null && addr.getState() != null &&
                addr.getState().equalsIgnoreCase(sellerState);

        BigDecimal totalTax = nz(o.getTaxTotal());
        String taxBreakdown;
        if (isIntraState) {
            BigDecimal cgst = totalTax.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            BigDecimal sgst = totalTax.subtract(cgst);
            taxBreakdown = "CGST: " + money(cgst) + " + SGST: " + money(sgst);
        } else {
            taxBreakdown = "IGST: " + money(totalTax);
        }

        StringBuilder rows = new StringBuilder();
        for (OrderItem it : items) {
            BigDecimal unit = nz(it.getUnitPrice());
            BigDecimal disc = nz(it.getDiscount());
            BigDecimal tax = nz(it.getTaxAmount());
            BigDecimal total = nz(it.getFinalPrice());
            rows.append("<tr>")
                .append("<td>").append(esc(it.getProductName()))
                .append(it.getVariantName() == null ? "" : "<br/><span class='muted'>" + esc(it.getVariantName()) + "</span>")
                .append("<br/><span class='muted'>SKU: ").append(esc(it.getSku())).append("</span></td>")
                .append("<td class='num'>").append(it.getQuantity()).append("</td>")
                .append("<td class='num'>").append(money(unit)).append("</td>")
                .append("<td class='num'>").append(money(disc)).append("</td>")
                .append("<td class='num'>").append(money(tax)).append("</td>")
                .append("<td class='num'><b>").append(money(total)).append("</b></td>")
                .append("</tr>");
        }

        String html = """
                <?xml version="1.0" encoding="UTF-8"?>
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
                <html xmlns="http://www.w3.org/1999/xhtml">
                <head><style>
                  @page { size: A4; margin: 36px 40px; }
                  body { font-family: Helvetica, Arial, sans-serif; color: #1d1d1f; font-size: 10px; }
                  h1 { font-size: 17px; margin: 0 0 2px 0; }
                  .muted { color: #6e6e73; }
                  .head { width: 100%; }
                  .head td { vertical-align: top; }
                  .box { border: 1px solid #d2d2d7; border-radius: 6px; padding: 8px 10px; margin-top: 14px; }
                  table.items { width: 100%; border-collapse: collapse; margin-top: 14px; }
                  table.items th { text-align: left; border-bottom: 1.5px solid #1d1d1f; padding: 5px 4px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.4px; }
                  table.items td { border-bottom: 1px solid #e8e8ed; padding: 6px 4px; vertical-align: top; }
                  .num { text-align: right; }
                  table.totals { width: 50%; margin-left: 50%; border-collapse: collapse; margin-top: 10px; }
                  table.totals td { padding: 3px 4px; }
                  .grand td { border-top: 1.5px solid #1d1d1f; font-size: 12px; padding-top: 6px; }
                  .foot { margin-top: 26px; color: #6e6e73; font-size: 8.5px; border-top: 1px solid #e8e8ed; padding-top: 8px; }
                </style></head>
                <body>
                  <table class="head"><tr>
                    <td>
                      <h1>%SELLER%</h1>
                      <div class="muted">%SELLERADDR%</div>
                      <div class="muted">GSTIN: <b>%GSTIN%</b></div>
                      <div class="muted">care@ivanta.in · +91 98290 41000</div>
                    </td>
                    <td class="num" style="text-align:right">
                      <h1>TAX INVOICE</h1>
                      <div><b>Invoice #:</b> %INVNO%</div>
                      <div><b>Order #:</b> %ORDNUM%</div>
                      <div><b>Order date:</b> %ORDDATE%</div>
                      <div><b>Invoice date:</b> %INVDATE%</div>
                    </td>
                  </tr></table>

                  <div class="box">
                    <b>Billed to</b><br/>
                    %CUSTOMER%<br/>
                    <span class="muted">%CEMAIL% · %CPHONE%</span><br/><br/>
                    <b>Shipping address</b><br/>
                    %ADDRESS%
                  </div>

                  <table class="items">
                    <tr><th>Item</th><th class="num">Qty</th><th class="num">Unit price</th>
                        <th class="num">Discount</th><th class="num">Tax</th><th class="num">Total</th></tr>
                    %ROWS%
                  </table>

                  <table class="totals">
                    <tr><td class="muted">Subtotal</td><td class="num">%SUBTOTAL%</td></tr>
                    <tr><td class="muted">Discount%COUPON%</td><td class="num">- %DISCOUNT%</td></tr>
                    <tr><td class="muted">Tax (%TAXBREAKDOWN%)</td><td class="num">%TAX%</td></tr>
                    <tr><td class="muted">Shipping</td><td class="num">%SHIPPING%</td></tr>
                    <tr class="grand"><td><b>Grand total</b></td><td class="num"><b>%GRAND%</b></td></tr>
                  </table>

                  <div class="box" style="margin-top:16px">
                    <b>Payment</b><br/>
                    Method: %METHOD% &nbsp;·&nbsp; Status: %PSTATUS%%PREF%
                  </div>

                  <div class="foot">
                    This is an official tax invoice for order %ORDNUM% issued by %SELLER% (GSTIN: %GSTIN%).
                    Fulfillment handled via owner-owned inventory and third-party logistics.
                  </div>
                </body></html>
                """
                .replace("%SELLER%", esc(sellerName))
                .replace("%SELLERADDR%", esc(sellerAddress))
                .replace("%GSTIN%", esc(sellerGstin))
                .replace("%INVNO%", esc(invoiceNumber))
                .replace("%ORDNUM%", esc(displayNumber(o)))
                .replace("%ORDDATE%", DATE_FMT.format(o.getPlacedAt()))
                .replace("%INVDATE%", DATE_FMT.format(java.time.Instant.now()))
                .replace("%CUSTOMER%", esc(customer))
                .replace("%CEMAIL%", esc(customerEmail == null ? "" : customerEmail))
                .replace("%CPHONE%", esc(customerPhone == null ? "" : customerPhone))
                .replace("%ADDRESS%", addressBlock(addr))
                .replace("%ROWS%", rows.toString())
                .replace("%SUBTOTAL%", money(nz(o.getSubtotal())))
                .replace("%COUPON%", o.getCouponCode() == null ? "" : " (" + esc(o.getCouponCode()) + ")")
                .replace("%DISCOUNT%", money(nz(o.getDiscountTotal())))
                .replace("%TAXBREAKDOWN%", esc(taxBreakdown))
                .replace("%TAX%", money(nz(o.getTaxTotal())))
                .replace("%SHIPPING%", money(nz(o.getShippingFee())))
                .replace("%GRAND%", money(nz(o.getGrandTotal())))
                .replace("%METHOD%", esc(o.getPaymentMethod() == null ? "—" : o.getPaymentMethod()))
                .replace("%PSTATUS%", esc(payment == null ? (o.getPaymentStatus() == null ? "—" : o.getPaymentStatus())
                        : payment.getStatus()))
                .replace("%PREF%", payment == null || payment.getProviderTransactionId() == null ? ""
                        : " &nbsp;·&nbsp; Ref: " + esc(payment.getProviderTransactionId()));

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Invoice PDF rendering failed: " + e.getMessage(), e);
        }
    }

    private String addressBlock(DeliveryAddress a) {
        if (a == null) return "<span class='muted'>Not recorded</span>";
        StringBuilder sb = new StringBuilder(esc(a.getName())).append("<br/>");
        sb.append(esc(a.getAddressLine1()));
        if (a.getAddressLine2() != null && !a.getAddressLine2().isBlank())
            sb.append(", ").append(esc(a.getAddressLine2()));
        sb.append("<br/>");
        if (a.getLocality() != null && !a.getLocality().isBlank())
            sb.append(esc(a.getLocality())).append(", ");
        sb.append(esc(a.getCity()));
        if (a.getDistrict() != null && !a.getDistrict().isBlank())
            sb.append(", ").append(esc(a.getDistrict()));
        sb.append("<br/>").append(esc(a.getState())).append(" — ").append(esc(a.getPincode()));
        sb.append("<br/>").append(esc(a.getCountry() == null ? "India" : a.getCountry()));
        if (a.getLandmark() != null && !a.getLandmark().isBlank())
            sb.append("<br/><span class='muted'>Near ").append(esc(a.getLandmark())).append("</span>");
        sb.append("<br/><span class='muted'>Phone: ").append(esc(a.getPhone())).append("</span>");
        return sb.toString();
    }

    private String setting(String key, String fallback) {
        return settings.findById(key).map(s -> s.getSettingValue() == null || s.getSettingValue().isBlank()
                ? fallback : s.getSettingValue()).orElse(fallback);
    }

    private static BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }

    private static String money(BigDecimal v) {
        return "₹" + nz(v).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private static String esc(String v) {
        if (v == null) return "";
        return v.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }
}
