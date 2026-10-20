package com.ivanta.payment.provider;

import com.ivanta.config.IvantaProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

/**
 * Development payment provider (§25). Implements the REAL verification pattern:
 * the reference is an HMAC issued server-side at initiate; verify() recomputes it
 * and compares in constant time — a client that never went through initiate
 * cannot forge success. Swap in RazorpayProvider for production via config.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ivanta.payment.provider", havingValue = "mock", matchIfMissing = true)
public class MockPaymentProvider implements PaymentProvider {

    private final IvantaProperties props;

    @Override
    public String name() { return "mock"; }

    @Override
    public InitResult initiate(String paymentId, BigDecimal amount, String method) {
        String reference = hmac(paymentId + ":" + amount.toPlainString() + ":" + method);
        String txn = "MOCK-" + paymentId;
        log.info("[MOCK PAY] initiate {} amount={} method={} ref={}", paymentId, amount, method, reference);
        return new InitResult(txn, "order_mock_" + paymentId, reference, reference, null, "{\"provider\":\"mock\",\"paymentId\":\"" + paymentId + "\"}");
    }

    @Override
    public VerifyResult verify(String paymentId, BigDecimal amount, String reference) {
        // amount is re-read from the DB by the caller — recompute over both method-agnostic parts
        boolean ok = false;
        for (String m : new String[]{"UPI", "CARD", "NETBANKING", "WALLET", "COD"}) {
            String expected = hmac(paymentId + ":" + amount.toPlainString() + ":" + m);
            if (reference != null && MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8), reference.getBytes(StandardCharsets.UTF_8))) {
                ok = true;
                break;
            }
        }
        return new VerifyResult(ok, "order_mock_" + paymentId, "pay_mock_" + paymentId,
                ok ? null : "reference mismatch",
                "{\"verified\":" + ok + "}");
    }

    @Override
    public RefundResult refund(String providerPaymentId, BigDecimal amount, String reason) {
        String txn = "rfnd_mock_" + System.currentTimeMillis() % 100000;
        log.info("[MOCK PAY] refund {} amount={} reason={}", providerPaymentId, amount, reason);
        return new RefundResult(true, txn, null, "{\"provider\":\"mock\",\"refund\":\"" + txn + "\"}");
    }

    @Override
    public boolean supportsCod() { return true; }

    private String hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(props.getPayment().getMockSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC unavailable", e);
        }
    }
}
