package com.ivanta.location;

import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ApiResponse;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.util.IdService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Location administration (§29): add/deactivate cities, localities, PINs and zones.
 * Deactivation only — never hard delete (historical addresses must stay resolvable).
 */
@RestController
@RequestMapping("/api/v1/admin/location")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('LOCATION_MANAGE')")
public class AdminLocationController {

    private final CityRepository cities;
    private final LocalityRepository localities;
    private final PincodeRepository pincodes;
    private final ZoneRepository zones;
    private final IdService ids;
    private final AuditService audit;

    public record CityUpsert(String name, String stateId, String districtId, Boolean popular) { }
    public record LocalityUpsert(String name, String cityId, Boolean popular) { }
    public record PincodeUpsert(String code, String stateId) { }
    public record ZoneUpsert(String name, Boolean serviceable, java.math.BigDecimal deliveryFee,
                             Integer etaMinDays, Integer etaMaxDays, List<String> pinPrefixes) { }

    @PostMapping("/cities")
    @Transactional
    public ApiResponse<City> createCity(@RequestBody CityUpsert req) {
        if (req.name() == null || req.name().isBlank() || req.stateId() == null)
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "name and stateId are required");
        City c = new City();
        c.setId(ids.next("cities", "CTY", 4));
        c.setName(req.name().trim());
        c.setStateId(req.stateId());
        c.setDistrictId(req.districtId());
        c.setPopular(Boolean.TRUE.equals(req.popular()));
        cities.save(c);
        audit.record("CITY_CREATED", "city", c.getId(), null, c.getName());
        return ApiResponse.ok(c);
    }

    @PatchMapping("/cities/{id}")
    @Transactional
    public ApiResponse<City> updateCity(@PathVariable String id, @RequestBody CityUpsert req) {
        City c = cities.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "City not found"));
        if (req.name() != null) c.setName(req.name().trim());
        if (req.popular() != null) c.setPopular(req.popular());
        cities.save(c);
        audit.record("CITY_UPDATED", "city", id, null, c.getName());
        return ApiResponse.ok(c);
    }

    @PostMapping("/localities")
    @Transactional
    public ApiResponse<Locality> createLocality(@RequestBody LocalityUpsert req) {
        if (req.name() == null || req.cityId() == null)
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "name and cityId are required");
        Locality l = new Locality();
        l.setId(ids.next("localities", "LOC", 4));
        l.setName(req.name().trim());
        l.setCityId(req.cityId());
        l.setPopular(Boolean.TRUE.equals(req.popular()));
        localities.save(l);
        audit.record("LOCALITY_CREATED", "locality", l.getId(), null, l.getName());
        return ApiResponse.ok(l);
    }

    @PostMapping("/pincodes")
    @Transactional
    public ApiResponse<Pincode> createPincode(@RequestBody PincodeUpsert req) {
        if (req.code() == null || !req.code().matches("\\d{6}"))
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "code must be 6 digits");
        if (pincodes.findByCode(req.code()).isPresent())
            throw new BusinessException(ErrorCode.CONFLICT, "PIN code already exists");
        Pincode p = new Pincode();
        p.setId(ids.next("pincodes", "PIN", 4));
        p.setCode(req.code());
        p.setStateId(req.stateId());
        pincodes.save(p);
        audit.record("PINCODE_CREATED", "pincode", p.getId(), null, p.getCode());
        return ApiResponse.ok(p);
    }

    @PostMapping("/zones")
    @Transactional
    public ApiResponse<ServiceabilityZone> createZone(@RequestBody ZoneUpsert req) {
        ServiceabilityZone z = new ServiceabilityZone();
        z.setId(ids.next("serviceability_zones", "ZON", 4));
        z.setName(req.name());
        z.setServiceable(req.serviceable() == null || req.serviceable());
        if (req.deliveryFee() != null) z.setDeliveryFee(req.deliveryFee());
        if (req.etaMinDays() != null) z.setEtaMinDays(req.etaMinDays().shortValue());
        if (req.etaMaxDays() != null) z.setEtaMaxDays(req.etaMaxDays().shortValue());
        z.setPinPrefixes(req.pinPrefixes());
        zones.save(z);
        audit.record("ZONE_CREATED", "serviceability_zone", z.getId(), null, z.getName());
        return ApiResponse.ok(z);
    }

    @PatchMapping("/zones/{id}")
    @Transactional
    public ApiResponse<ServiceabilityZone> updateZone(@PathVariable String id, @RequestBody ZoneUpsert req) {
        ServiceabilityZone z = zones.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Zone not found"));
        String before = "serviceable=" + z.getServiceable();
        if (req.name() != null) z.setName(req.name());
        if (req.serviceable() != null) z.setServiceable(req.serviceable());
        if (req.deliveryFee() != null) z.setDeliveryFee(req.deliveryFee());
        if (req.etaMinDays() != null) z.setEtaMinDays(req.etaMinDays().shortValue());
        if (req.etaMaxDays() != null) z.setEtaMaxDays(req.etaMaxDays().shortValue());
        if (req.pinPrefixes() != null) z.setPinPrefixes(req.pinPrefixes());
        zones.save(z);
        audit.record("ZONE_UPDATED", "serviceability_zone", id, before, "serviceable=" + z.getServiceable());
        return ApiResponse.ok(z);
    }

    @GetMapping("/zones")
    @Transactional(readOnly = true)
    public ApiResponse<List<ServiceabilityZone>> listZones() {
        return ApiResponse.ok(zones.findByIsActiveTrue());
    }
}
