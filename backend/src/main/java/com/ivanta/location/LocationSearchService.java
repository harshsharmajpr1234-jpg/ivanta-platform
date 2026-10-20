package com.ivanta.location;

import com.ivanta.location.dto.LocationDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Location search + serviceability (§28).
 * Ranking: exact match > PIN prefix > locality exact > popular > prefix > contains.
 * Minimum 2 characters, max 8 suggestions. PIN codes resolve through the M:N
 * tables (one PIN can map to multiple localities/cities).
 */
@Service
@RequiredArgsConstructor
public class LocationSearchService {

    private static final int MIN_QUERY = 2;
    private static final int MAX_RESULTS = 8;

    private final CityRepository cities;
    private final LocalityRepository localities;
    private final PincodeRepository pincodes;
    private final PostOfficeRepository postOffices;
    private final StateRepository states;
    private final ZoneRepository zones;
    private final com.ivanta.delivery.ShippingMethodRepository shippingMethods;
    private final com.ivanta.location.provider.IndiaPostPincodeProvider indiaPostProvider;

    private record Ranked(int rank, Suggestion s) { }

    @Transactional(readOnly = true)
    public SearchResponse search(String rawQuery) {
        String q = rawQuery == null ? "" : rawQuery.trim();
        if (q.length() < MIN_QUERY) return new SearchResponse(q, List.of());

        List<Ranked> ranked = new ArrayList<>();

        // 1) all-digit query -> PIN codes (exact first, then prefix)
        if (q.matches("\\d{2,6}")) {
            pincodes.findByCode(q).ifPresent(p ->
                    ranked.add(new Ranked(0, pinSuggestion(p))));
            pincodes.findTop10ByCodeStartingWithAndIsActiveTrue(q).forEach(p -> {
                if (!p.getCode().equals(q)) ranked.add(new Ranked(1, pinSuggestion(p)));
            });
        }

        String ql = q.toLowerCase();

        // 2) cities: exact > popular-prefix > prefix > contains
        cities.findTop10ByNameStartingWithIgnoreCaseAndIsActiveTrue(q).forEach(c -> {
            int rank = c.getName().equalsIgnoreCase(q) ? 0
                    : Boolean.TRUE.equals(c.getPopular()) ? 2 : 4;
            ranked.add(new Ranked(rank, new Suggestion(c.getId(), "city", c.getName(),
                    stateName(c.getStateId()), null, stateName(c.getStateId()), null,
                    Boolean.TRUE.equals(c.getPopular()))));
        });
        cities.searchContains(ql, PageRequest.of(0, 10)).stream()
                .filter(c -> !c.getName().toLowerCase().startsWith(ql))
                .forEach(c -> ranked.add(new Ranked(5, new Suggestion(c.getId(), "city", c.getName(),
                        stateName(c.getStateId()), null, stateName(c.getStateId()), null,
                        Boolean.TRUE.equals(c.getPopular())))));

        // 3) localities: exact > prefix > contains
        localities.findFirstByNameIgnoreCaseAndIsActiveTrue(q).ifPresent(l ->
                ranked.add(new Ranked(0, localitySuggestion(l))));
        localities.findTop10ByNameStartingWithIgnoreCaseAndIsActiveTrue(q).stream()
                .filter(l -> !l.getName().equalsIgnoreCase(q))
                .forEach(l -> ranked.add(new Ranked(2, localitySuggestion(l))));
        localities.searchContains(ql, PageRequest.of(0, 10)).stream()
                .filter(l -> !l.getName().toLowerCase().startsWith(ql))
                .forEach(l -> ranked.add(new Ranked(5, localitySuggestion(l))));

        List<Suggestion> out = ranked.stream()
                .sorted(Comparator.comparingInt(Ranked::rank)
                        .thenComparing(r -> r.s().popular() ? 0 : 1)
                        .thenComparing(r -> r.s().label(), String.CASE_INSENSITIVE_ORDER))
                .map(Ranked::s)
                .distinct()
                .limit(MAX_RESULTS)
                .toList();
        return new SearchResponse(q, out);
    }

    private Suggestion pinSuggestion(Pincode p) {
        String city = p.getCities() == null || p.getCities().isEmpty() ? null : p.getCities().get(0).getName();
        return new Suggestion(p.getId(), "pincode", p.getCode(),
                city == null ? stateName(p.getStateId()) : city + ", " + stateName(p.getStateId()),
                city, stateName(p.getStateId()), p.getCode(), false);
    }

    private Suggestion localitySuggestion(Locality l) {
        String cityName = cities.findById(l.getCityId()).map(City::getName).orElse(null);
        return new Suggestion(l.getId(), "locality", l.getName(), cityName, cityName, null, null,
                Boolean.TRUE.equals(l.getPopular()));
    }

    private String stateName(String stateId) {
        return states.findById(stateId).map(StateEntity::getName).orElse(null);
    }

    /* ---------- pincode details ---------- */

    @Transactional(readOnly = true)
    public PincodeInfo pincodeInfo(String code) {
        Optional<Pincode> opt = pincodes.findByCode(code);
        if (opt.isPresent()) {
            Pincode p = opt.get();
            List<String> cityNames = p.getCities() == null ? List.of() : p.getCities().stream().map(City::getName).toList();
            List<String> locNames = p.getLocalities() == null ? List.of() : p.getLocalities().stream().map(Locality::getName).toList();
            List<String> pos = postOffices.findByPincodeIdAndIsActiveTrue(p.getId()).stream().map(PostOffice::getName).toList();
            boolean serviceable = isPinServiceable(code).serviceable();
            return new PincodeInfo(p.getCode(), cityNames, List.of(stateName(p.getStateId())), locNames, pos, serviceable);
        }

        if (code != null && code.matches("\\d{6}")) {
            PincodeInfo liveInfo = indiaPostProvider.lookupPincode(code);
            if (liveInfo != null) {
                boolean serviceable = isPinServiceable(code).serviceable();
                return new PincodeInfo(liveInfo.code(), liveInfo.cities(), liveInfo.states(),
                        liveInfo.localities(), liveInfo.postOffices(), serviceable);
            }
        }

        throw new com.ivanta.common.exception.ResourceNotFoundException("PIN code " + code);
    }

    /* ---------- serviceability (§29) ---------- */

    @Transactional(readOnly = true)
    public ServiceabilityResponse isPinServiceable(String pin) {
        if (pin == null || !pin.matches("\\d{6}"))
            return new ServiceabilityResponse(false, null, null, null, null, null, "Enter a valid 6-digit PIN code", List.of());

        List<ServiceabilityZone> serviceable = zones.findServiceableByPinPrefix(pin);
        if (!serviceable.isEmpty()) {
            ServiceabilityZone z = serviceable.get(0);
            List<ShippingMethodOption> methods = shippingMethods.findByIsActiveTrueOrderBySortOrderAsc().stream()
                    .map(m -> new ShippingMethodOption(m.getId(), m.getName(), m.getBaseFee(),
                            m.getEtaMinDays().intValue(), m.getEtaMaxDays().intValue()))
                    .toList();
            return new ServiceabilityResponse(true, z.getName(), z.getDeliveryFee(),
                    z.getEtaMinDays().intValue(), z.getEtaMaxDays().intValue(), null,
                    "Delivery available in " + z.getEtaMinDays() + "-" + z.getEtaMaxDays() + " days",
                    methods);
        }
        List<ServiceabilityZone> planned = zones.findAnyByPinPrefix(pin);
        if (!planned.isEmpty()) {
            ServiceabilityZone z = planned.get(0);
            return new ServiceabilityResponse(false, z.getName(), null, null, null,
                    z.getPlannedDate() == null ? null : z.getPlannedDate().toString(),
                    "We're expanding to " + z.getName() + (z.getPlannedDate() != null ? " by " + z.getPlannedDate() : " soon"),
                    List.of());
        }
        return new ServiceabilityResponse(false, null, null, null, null, null,
                "Sorry, delivery is not available for this PIN code yet", List.of());
    }

    /* ---------- browse ---------- */

    @Transactional(readOnly = true)
    public List<CityResponse> listCities(String stateId) {
        List<City> list = (stateId == null || stateId.isBlank())
                ? cities.findByIsActiveTrueAndPopularTrueOrderByNameAsc()
                : cities.findByStateIdAndIsActiveTrueOrderByNameAsc(stateId);
        return list.stream().map(c -> new CityResponse(c.getId(), c.getName(), stateName(c.getStateId()),
                Boolean.TRUE.equals(c.getPopular()))).toList();
    }

    @Transactional(readOnly = true)
    public List<LocalityResponse> listLocalities(String cityId) {
        return localities.findByCityIdAndIsActiveTrueOrderByNameAsc(cityId).stream()
                .map(l -> new LocalityResponse(l.getId(), l.getName(), l.getCityId(),
                        Boolean.TRUE.equals(l.getPopular()))).toList();
    }
}
