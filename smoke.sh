#!/bin/bash
B=http://localhost:8080/api/v1
U=/tmp/user.jar; A=/tmp/admin.jar; rm -f $U $A
J() { python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d)[:$2])" 2>/dev/null || echo PARSE_FAIL; }
G() { python3 -c "
import json,sys
d=json.load(sys.stdin)
v=d
for k in '$2'.split('.'):
    if k=='': continue
    v=v[int(k)] if k.isdigit() else (v.get(k) if isinstance(v,dict) else None)
print(v)"; }

echo "1. serviceability:"; curl -s "$B/location/serviceability?pin=302021" | G "" data.serviceable
echo "2. register:"; REG=$(curl -s -c $U -H 'Content-Type: application/json' -d '{"name":"Asha Sharma","email":"asha9@test.in","phone":"9876543218","password":"Test@1234"}' $B/auth/register); echo $REG | G "" data.id
echo "3. me:"; curl -s -b $U $B/auth/me | G "" data.email
echo "4. address:"; AID=$(curl -s -b $U -c $U -H 'Content-Type: application/json' -d '{"name":"Asha Sharma","phone":"9876543218","addressLine1":"12 MI Road","city":"Jaipur","district":"Jaipur","state":"Rajasthan","pincode":"302021","addressType":"HOME","isDefault":true}' $B/users/me/addresses | G "" data.id); echo "AID=$AID"
echo "5. cart add:"; curl -s -b $U -c $U -H 'Content-Type: application/json' -d '{"productId":"PRD-0001","quantity":1}' $B/cart/items | J "" 200
echo "6. cart view (DB price):"; curl -s -b $U $B/cart | G "" data.subtotal
echo "7. preview+coupon:"; PV=$(curl -s -X POST -b $U "$B/checkout/preview?addressId=$AID&shippingMethodId=SM-0001&couponCode=IVANTA10&paymentMethod=UPI"); echo "subtotal=$(echo $PV | G "" data.subtotal) discount=$(echo $PV | G "" data.couponDiscount) ship=$(echo $PV | G "" data.shippingFee) grand=$(echo $PV | G "" data.grandTotal)"
echo "8. place order:"; OD=$(curl -s -b $U -c $U -H 'Content-Type: application/json' -d "{\"addressId\":\"$AID\",\"shippingMethodId\":\"SM-0001\",\"couponCode\":\"IVANTA10\",\"paymentMethod\":\"UPI\"}" $B/orders); OID=$(echo $OD | G "" data.id); echo "OID=$OID status=$(echo $OD | G "" data.status)"
echo "9. payment initiate:"; PI=$(curl -s -b $U -c $U -H 'Content-Type: application/json' -d "{\"orderId\":\"$OID\",\"method\":\"UPI\"}" $B/payments/initiate); PAYID=$(echo $PI | G "" data.id); SECRET=$(echo $PI | G "" data.clientSecret); echo "PAYID=$PAYID secret=${SECRET:0:20}..."
echo "10. verify WRONG reference:"; curl -s -b $U -H 'Content-Type: application/json' -d '{"reference":"forged"}' $B/payments/$PAYID/verify | J "" 160
echo "    (order after fail):"; curl -s -b $U $B/orders/$OID | G "" data.status
echo "11. second order for success path:"; curl -s -b $U -c $U -H 'Content-Type: application/json' -d '{"productId":"PRD-0001","quantity":1}' $B/cart/items > /dev/null; OD2=$(curl -s -b $U -c $U -H 'Content-Type: application/json' -d "{\"addressId\":\"$AID\",\"shippingMethodId\":\"SM-0001\",\"couponCode\":\"IVANTA10\",\"paymentMethod\":\"UPI\"}" $B/orders); OID2=$(echo $OD2 | G "" data.id); PI2=$(curl -s -b $U -c $U -H 'Content-Type: application/json' -d "{\"orderId\":\"$OID2\",\"method\":\"UPI\"}" $B/payments/initiate); PAYID2=$(echo $PI2 | G "" data.id); SECRET2=$(echo $PI2 | G "" data.clientSecret); echo "OID2=$OID2"
echo "12. verify CORRECT reference:"; curl -s -b $U -c $U -H 'Content-Type: application/json' -d "{\"reference\":\"$SECRET2\"}" $B/payments/$PAYID2/verify | G "" data.status
echo "    order2 status:"; curl -s -b $U $B/orders/$OID2 | G "" data.status
echo "13. admin login:"; curl -s -c $A -H 'Content-Type: application/json' -d '{"email":"admin@ivanta.in","password":"Root@12345"}' $B/admin/auth/login | G "" data.authenticated
echo "14. stats w/o login (401 expected):"; curl -s -o /dev/null -w "%{http_code}\n" $B/admin/stats
echo "15. dashboard:"; curl -s -b $A $B/admin/stats | J "" 300
echo "16. PROCESSING+PACKED:"; curl -s -b $A -H 'Content-Type: application/json' -d '{"status":"PROCESSING","reason":"packing"}' $B/admin/orders/$OID2/status | G "" data.status; curl -s -b $A -H 'Content-Type: application/json' -d '{"status":"PACKED","reason":"boxed"}' $B/admin/orders/$OID2/status | G "" data.status
echo "17. ship:"; SH=$(curl -s -b $A -H 'Content-Type: application/json' -d '{"carrier":"BlueDart"}' $B/admin/delivery/orders/$OID2/ship); echo $SH | G "" data.status; SHPID=$(curl -s -b $A "$B/admin/delivery/shipments?orderId=$OID2" | G "" data.content.0.id); echo "SHPID=$SHPID"
echo "18. events:"; curl -s -b $A -H 'Content-Type: application/json' -d '{"status":"OUT_FOR_DELIVERY","location":"Jaipur Hub"}' $B/admin/delivery/shipments/$SHPID/events | G "" data.orderStatus; curl -s -b $A -H 'Content-Type: application/json' -d '{"status":"DELIVERED","location":"Jaipur"}' $B/admin/delivery/shipments/$SHPID/events | G "" data.orderStatus
echo "19. customer tracking:"; curl -s -b $U $B/delivery/orders/$OID2/tracking | G "" data.orderStatus
echo "20. review (verified):"; curl -s -b $U -H 'Content-Type: application/json' -d '{"productId":"PRD-0001","rating":5,"title":"Excellent","body":"Genuine product, fast delivery"}' $B/reviews | G "" data.verifiedPurchase
echo "21. return request:"; RID=$(curl -s -b $U -c $U -H 'Content-Type: application/json' -d "{\"orderId\":\"$OID2\",\"reason\":\"Changed my mind\",\"notes\":\"sealed\"}" $B/returns | G "" data.id); echo "RID=$RID"
echo "22. return chain:"; for S in APPROVED PICKUP_SCHEDULED RECEIVED INSPECTING APPROVED_FOR_REFUND REFUND_PROCESSING; do R=$(curl -s -b $A -H 'Content-Type: application/json' -d "{\"status\":\"$S\"}" $B/admin/returns/$RID/status); echo "$S -> $(echo $R | G "" data.status) $(echo $R | G "" data.orderStatus)"; done
echo "23. order final:"; curl -s -b $U $B/orders/$OID2 | G "" data.status
echo "24. refunds:"; curl -s -b $A $B/admin/refunds | G "" data.content.0.status
echo "25. audit logs count:"; curl -s -b $A "$B/admin/audit-logs?page=0&size=1" | G "" data.totalElements
