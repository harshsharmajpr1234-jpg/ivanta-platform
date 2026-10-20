#!/bin/bash
# Full order-management E2E smoke (V18 lifecycle). Fresh creds per run.
B=http://localhost:8080/api/v1
U=/tmp/ou.jar; A=/tmp/oa.jar; rm -f $U $A
SUF=$RANDOM$RANDOM
G() { python3 -c "
import json,sys
d=json.load(sys.stdin)
v=d
for k in '$2'.split('.'):
    if k=='': continue
    v=v[int(k)] if k.isdigit() else (v.get(k) if isinstance(v,dict) else None)
print(v if v is not None else '')"; }

echo "== setup =="
curl -s -c $U -H 'Content-Type: application/json' -d "{\"name\":\"Om Smoke\",\"email\":\"om$SUF@test.in\",\"phone\":\"9$(printf '%09d' $((SUF % 1000000000)))\",\"password\":\"Test@1234\"}" $B/auth/register > /dev/null
AID=$(curl -s -b $U -c $U -H 'Content-Type: application/json' -d "{\"name\":\"Om Smoke\",\"phone\":\"9$(printf '%09d' $((SUF % 1000000000)))\",\"addressLine1\":\"12 MI Road\",\"city\":\"Jaipur\",\"district\":\"Jaipur\",\"state\":\"Rajasthan\",\"pincode\":\"302021\",\"addressType\":\"HOME\",\"isDefault\":true}" $B/users/me/addresses | G "" data.id)
echo "AID=$AID"

place() { # $1 = variant
  curl -s -b $U -c $U -H 'Content-Type: application/json' -d "{\"productId\":\"PRD-0001\",\"variantId\":\"$1\",\"quantity\":1}" $B/cart/items > /dev/null
  curl -s -b $U -c $U -H 'Content-Type: application/json' -d "{\"addressId\":\"$AID\",\"shippingMethodId\":\"SM-0001\",\"paymentMethod\":\"UPI\"}" $B/orders
}
payverify() { # $1 = orderId -> echoes payment status
  local PI PAYID SECRET
  PI=$(curl -s -b $U -c $U -H 'Content-Type: application/json' -d "{\"orderId\":\"$1\",\"method\":\"UPI\"}" $B/payments/initiate)
  PAYID=$(echo "$PI" | G "" data.id); SECRET=$(echo "$PI" | G "" data.clientSecret)
  curl -s -b $U -H 'Content-Type: application/json' -d "{\"reference\":\"$SECRET\"}" $B/payments/$PAYID/verify | G "" data.status
}
admstat() { curl -s -b $A -H 'Content-Type: application/json' -d "{\"status\":\"$2\",\"reason\":\"smoke\"}" $B/admin/orders/$1/status | G "" data.status; }

echo "== A: full lifecycle to REFUNDED =="
OA=$(place VAR-0002); OIDA=$(echo "$OA" | G "" data.id); ONA=$(echo "$OA" | G "" data.orderNumber)
echo "placed: id=$OIDA number=$ONA status=$(echo "$OA" | G "" data.status) pay=$(echo "$OA" | G "" data.paymentStatus)"
PIA=$(curl -s -b $U -c $U -H 'Content-Type: application/json' -d "{\"orderId\":\"$OIDA\",\"method\":\"UPI\"}" $B/payments/initiate)
PAYA=$(echo "$PIA" | G "" data.id)
echo "wrong ref -> pay:$(curl -s -b $U -H 'Content-Type: application/json' -d '{"reference":"forged"}' $B/payments/$PAYA/verify | G "" data.status) order:$(curl -s -b $U $B/orders/$OIDA | G "" data.status)"
PIA2=$(curl -s -b $U -c $U -H 'Content-Type: application/json' -d "{\"orderId\":\"$OIDA\",\"method\":\"UPI\"}" $B/payments/initiate)
echo "retry ok: $(curl -s -b $U -H 'Content-Type: application/json' -d "{\"reference\":\"$(echo "$PIA2" | G "" data.clientSecret)\"}" $B/payments/$(echo "$PIA2" | G "" data.id)/verify | G "" data.status) order:$(curl -s -b $U $B/orders/$OIDA | G "" data.status) payStatus:$(curl -s -b $U $B/orders/$OIDA | G "" data.paymentStatus)"
curl -s -c $A -H 'Content-Type: application/json' -d '{"email":"admin@ivanta.in","password":"Root@12345"}' $B/admin/auth/login > /dev/null
echo "admin search q=$ONA total:$(curl -s -b $A "$B/admin/orders?q=$ONA" | G "" data.totalElements)"
echo "confirm:$(admstat $OIDA CONFIRMED) process:$(admstat $OIDA PROCESSING) pack:$(admstat $OIDA PACKED)"
curl -s -b $A -H 'Content-Type: application/json' -d '{"note":"VIP customer, handle with care"}' $B/admin/orders/$OIDA/notes | G "" data.0.note
SH=$(curl -s -b $A -X POST -H 'Content-Type: application/json' -d '{"carrier":"BlueDart","trackingNumber":"BD'"$SUF"'"}' $B/admin/delivery/orders/$OIDA/ship)
SHIDA=$(echo "$SH" | G "" data.id); echo "ship:$(echo "$SH" | G "" data.orderStatus) tracking=$(echo "$SH" | G "" data.trackingNumber)"
curl -s -b $A -H 'Content-Type: application/json' -d '{"status":"IN_TRANSIT","description":"Arrived Jaipur hub","location":"Jaipur, RJ"}' $B/admin/delivery/shipments/$SHIDA/events | G "" data.orderStatus
curl -s -b $A -H 'Content-Type: application/json' -d '{"status":"OUT_FOR_DELIVERY","description":"With courier","location":"Jaipur"}' $B/admin/delivery/shipments/$SHIDA/events | G "" data.orderStatus
curl -s -b $A -H 'Content-Type: application/json' -d '{"status":"DELIVERED","description":"Handed to customer","location":"Jaipur"}' $B/admin/delivery/shipments/$SHIDA/events | G "" data.orderStatus
echo "cust tracking:$(curl -s -b $U $B/orders/$OIDA/tracking | G "" data.shipment.status) timeline events:$(curl -s -b $U $B/orders/$OIDA/timeline | python3 -c 'import json,sys;print(len(json.load(sys.stdin)["data"]))')"
INV=$(curl -s -b $U $B/orders/$OIDA/invoice -o /tmp/inv.pdf -w "%{http_code} %{content_type}")
echo "invoice: $INV size=$(stat -c%s /tmp/inv.pdf 2>/dev/null) head=$(head -c4 /tmp/inv.pdf)"
echo "returnEligible:$(curl -s -b $U $B/orders/$OIDA | G "" data.returnEligible)"
OIA=$(curl -s -b $U $B/orders/$OIDA | G "" data.items.0.id)
RA=$(curl -s -b $U -H 'Content-Type: application/json' -d "{\"orderId\":\"$OIDA\",\"reason\":\"screen defect\",\"itemIds\":[\"$OIA\"]}" $B/returns)
RIDA=$(echo "$RA" | G "" data.id); echo "return:$RIDA status=$(echo "$RA" | G "" data.status) order:$(curl -s -b $U $B/orders/$OIDA | G "" data.status)"
for RS in APPROVED PICKUP_SCHEDULED PICKED_UP RECEIVED INSPECTION APPROVED_FOR_REFUND REFUND_PROCESSING; do
  R=$(curl -s -b $A -H 'Content-Type: application/json' -d "{\"status\":\"$RS\"}" $B/admin/returns/$RIDA/status)
  echo "  return->$RS order:$(curl -s -b $U $B/orders/$OIDA | G "" data.status) pay:$(curl -s -b $U $B/orders/$OIDA | G "" data.paymentStatus)"
done

echo "== B: direct cancel while PENDING_PAYMENT =="
OB=$(place VAR-0001); OIDB=$(echo "$OB" | G "" data.id)
echo "cancel:$(curl -s -b $U -X POST -H 'Content-Type: application/json' -d '{"reason":"changed mind"}' $B/orders/$OIDB/cancel | G "" data.status) ship:$(curl -s -b $U $B/orders/$OIDB | G "" data.shippingStatus)"

echo "== C: cancel-request while shipped, admin rejects =="
OC=$(place VAR-0003); OIDC=$(echo "$OC" | G "" data.id)
payverify $OIDC > /dev/null
admstat $OIDC CONFIRMED > /dev/null; admstat $OIDC PROCESSING > /dev/null; admstat $OIDC PACKED > /dev/null
SHC=$(curl -s -b $A -X POST -H 'Content-Type: application/json' -d '{"carrier":"Delhivery"}' $B/admin/delivery/orders/$OIDC/ship); SHIDC=$(echo "$SHC" | G "" data.id)
echo "cust cancel shipped:$(curl -s -b $U -X POST -H 'Content-Type: application/json' -d '{"reason":"not needed"}' $B/orders/$OIDC/cancel | G "" data.status)"
echo "admin rejects -> IN_TRANSIT:$(admstat $OIDC IN_TRANSIT) then delivered:$(curl -s -b $A -H 'Content-Type: application/json' -d '{"status":"DELIVERED","description":"done","location":"Jaipur"}' $B/admin/delivery/shipments/$SHIDC/events | G "" data.orderStatus)"

echo "== D: replacement =="
REPD=$(curl -s -b $U -H 'Content-Type: application/json' -d "{\"orderId\":\"$OIDC\",\"orderItemId\":\"$(curl -s -b $U $B/orders/$OIDC | G "" data.items.0.id)\",\"reason\":\"battery drains fast\"}" $B/replacements)
REPID=$(echo "$REPD" | G "" data.id); echo "replacement:$REPID status=$(echo "$REPD" | G "" data.status) order:$(curl -s -b $U $B/orders/$OIDC | G "" data.status)"
RA2=$(curl -s -b $A -H 'Content-Type: application/json' -d '{"status":"APPROVED"}' $B/admin/replacements/$REPID/status)
echo "approved -> order:$(curl -s -b $U $B/orders/$OIDC | G "" data.status) replOrder:$(echo "$RA2" | G "" data.replacementOrderNumber) replStatus:$(echo "$RA2" | G "" data.status)"
ROID=$(echo "$RA2" | G "" data.replacementOrderId)
echo "repl order: grand=$(curl -s -b $A $B/admin/orders/$ROID | G "" data.grandTotal) status=$(curl -s -b $A $B/admin/orders/$ROID | G "" data.status)"

echo "== stats & notifications =="
ST=$(curl -s -b $A $B/admin/stats)
echo "counts: pending=$(echo "$ST" | G "" data.counts.pendingOrders) packed=$(echo "$ST" | G "" data.counts.packedOrders) openRepl=$(echo "$ST" | G "" data.counts.openReplacements) revWeek=$(echo "$ST" | G "" data.currency.revenueWeek) revMonth=$(echo "$ST" | G "" data.currency.revenueMonth)"
echo "notifications:"; curl -s -b $U "$B/notifications?page=0&size=8" | python3 -c 'import json,sys; c=json.load(sys.stdin)["data"]["notifications"]; print(len(c),"recent:"); [print("  -",n["title"]) for n in c[:8]]'
echo "== done =="
