package com.ivanta.user;

import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.exception.ResourceNotFoundException;
import com.ivanta.common.util.IdService;
import com.ivanta.dto.UserDtos.*;
import com.ivanta.location.LocationSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/** Addresses (§17): multiple per user, soft delete, single default. */
@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addresses;
    private final LocationSearchService location;
    private final IdService ids;

    @Transactional(readOnly = true)
    public List<AddressView> list(String userId) {
        return addresses.findByUserIdAndIsActiveTrueAndDeletedAtIsNullOrderByIdDesc(userId).stream()
                .map(AddressService::toView).toList();
    }

    @Transactional(readOnly = true)
    public Address getOwned(String addressId, String userId) {
        return addresses.findByIdAndUserIdAndDeletedAtIsNull(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address " + addressId));
    }

    @Transactional
    public AddressView create(String userId, AddressRequest req) {
        if (!location.isPinServiceable(req.pincode()).serviceable())
            throw new BusinessException(ErrorCode.NOT_SERVICEABLE,
                    "We don't deliver to PIN " + req.pincode() + " yet");
        Address a = new Address();
        a.setId(ids.next("addresses", "ADR", 5));
        a.setUserId(userId);
        apply(a, req);
        boolean first = addresses.findByUserIdAndIsActiveTrueAndDeletedAtIsNullOrderByIdDesc(userId).isEmpty();
        a.setIsDefault(first || Boolean.TRUE.equals(req.isDefault()));
        if (Boolean.TRUE.equals(a.getIsDefault())) addresses.clearDefaults(userId);
        addresses.save(a);
        return toView(a);
    }

    @Transactional
    public AddressView update(String userId, String id, AddressRequest req) {
        Address a = getOwned(id, userId);
        apply(a, req);
        if (Boolean.TRUE.equals(req.isDefault())) {
            addresses.clearDefaults(userId);
            a.setIsDefault(true);
        }
        addresses.save(a);
        return toView(a);
    }

    @Transactional
    public void delete(String userId, String id) {
        Address a = getOwned(id, userId);
        a.setDeletedAt(Instant.now());
        a.setIsActive(false);
        addresses.save(a);
    }

    @Transactional
    public AddressView setDefault(String userId, String id) {
        Address a = getOwned(id, userId);
        addresses.clearDefaults(userId);
        a.setIsDefault(true);
        addresses.save(a);
        return toView(a);
    }

    private void apply(Address a, AddressRequest req) {
        if (req.name() != null) a.setName(req.name().trim());
        if (req.phone() != null) a.setPhone(req.phone().trim());
        if (req.addressLine1() != null) a.setAddressLine1(req.addressLine1().trim());
        a.setAddressLine2(req.addressLine2());
        a.setLocality(req.locality());
        a.setRoad(req.road());
        if (req.city() != null) a.setCity(req.city().trim());
        a.setDistrict(req.district());
        if (req.state() != null) a.setState(req.state().trim());
        if (req.pincode() != null) a.setPincode(req.pincode().trim());
        a.setLatitude(req.latitude());
        a.setLongitude(req.longitude());
        a.setLandmark(req.landmark());
        if (req.addressType() != null) a.setAddressType(req.addressType());
    }

    public static AddressView toView(Address a) {
        return new AddressView(a.getId(), a.getName(), a.getPhone(), a.getAddressLine1(), a.getAddressLine2(),
                a.getLocality(), a.getRoad(), a.getCity(), a.getDistrict(), a.getState(), a.getPincode(),
                a.getCountry(), a.getLandmark(), a.getAddressType(), Boolean.TRUE.equals(a.getIsDefault()),
                a.getLatitude(), a.getLongitude());
    }
}
