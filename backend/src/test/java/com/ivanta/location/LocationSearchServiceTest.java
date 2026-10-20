package com.ivanta.location;

import com.ivanta.delivery.ShippingMethod;
import com.ivanta.delivery.ShippingMethodRepository;
import com.ivanta.location.dto.LocationDtos.SearchResponse;
import com.ivanta.location.dto.LocationDtos.ServiceabilityResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** §59: location search ranking, 2-char minimum, serviceability outcomes. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LocationSearchServiceTest {

    @Mock CityRepository cities;
    @Mock LocalityRepository localities;
    @Mock PincodeRepository pincodes;
    @Mock PostOfficeRepository postOffices;
    @Mock StateRepository states;
    @Mock ZoneRepository zones;
    @Mock ShippingMethodRepository shippingMethods;
    @Mock com.ivanta.location.provider.IndiaPostPincodeProvider indiaPostProvider;

    LocationSearchService service;

    @BeforeEach
    void setUp() {
        service = new LocationSearchService(cities, localities, pincodes, postOffices,
                states, zones, shippingMethods, indiaPostProvider);
        StateEntity raj = new StateEntity();
        raj.setId("ST-RJ");
        raj.setName("Rajasthan");
        when(states.findById("ST-RJ")).thenReturn(Optional.of(raj));
    }

    private City city(String id, String name, boolean popular) {
        City c = new City();
        c.setId(id);
        c.setName(name);
        c.setStateId("ST-RJ");
        c.setPopular(popular);
        c.setIsActive(true);
        return c;
    }

    @Test
    void requiresTwoCharacters() {
        assertThat(service.search("j").suggestions()).isEmpty();
        assertThat(service.search("").suggestions()).isEmpty();
        assertThat(service.search(null).suggestions()).isEmpty();
    }

    @Test
    void prefixFindsJaipur() {
        when(cities.findTop10ByNameStartingWithIgnoreCaseAndIsActiveTrue("jai"))
                .thenReturn(List.of(city("CTY-JPR", "Jaipur", true)));
        SearchResponse r = service.search("jai");
        assertThat(r.suggestions()).isNotEmpty();
        assertThat(r.suggestions().get(0).label()).isEqualTo("Jaipur");
        assertThat(r.suggestions().get(0).type()).isEqualTo("city");
    }

    @Test
    void exactMatchOutranksContains() {
        when(cities.findTop10ByNameStartingWithIgnoreCaseAndIsActiveTrue("jaipur"))
                .thenReturn(List.of(city("CTY-JPR", "Jaipur", true)));
        when(cities.searchContains(eq("jaipur"), any()))
                .thenReturn(List.of(city("CTY-JPR", "Jaipur", true), city("CTY-X", "New Jaipur East", false)));
        SearchResponse r = service.search("jaipur");
        assertThat(r.suggestions().get(0).label()).isEqualTo("Jaipur");
    }

    @Test
    void digitQuerySearchesPincodes() {
        Pincode p = new Pincode();
        p.setId("PIN-1");
        p.setCode("302021");
        p.setStateId("ST-RJ");
        when(pincodes.findByCode("3020")).thenReturn(Optional.empty());
        when(pincodes.findTop10ByCodeStartingWithAndIsActiveTrue("3020")).thenReturn(List.of(p));
        SearchResponse r = service.search("3020");
        assertThat(r.suggestions()).isNotEmpty();
        assertThat(r.suggestions().get(0).type()).isEqualTo("pincode");
        assertThat(r.suggestions().get(0).label()).isEqualTo("302021");
    }

    @Test
    void localityPrefixRankedHigh() {
        Locality l = new Locality();
        l.setId("LOC-1");
        l.setName("Malviya Nagar");
        l.setCityId("CTY-JPR");
        l.setPopular(true);
        when(localities.findTop10ByNameStartingWithIgnoreCaseAndIsActiveTrue("malv")).thenReturn(List.of(l));
        when(cities.findById("CTY-JPR")).thenReturn(Optional.of(city("CTY-JPR", "Jaipur", true)));
        SearchResponse r = service.search("malv");
        assertThat(r.suggestions().get(0).label()).isEqualTo("Malviya Nagar");
        assertThat(r.suggestions().get(0).sublabel()).isEqualTo("Jaipur");
    }

    private ServiceabilityZone zone(String name, boolean serviceable, String fee, LocalDate planned) {
        ServiceabilityZone z = new ServiceabilityZone();
        z.setId("ZON-1");
        z.setName(name);
        z.setServiceable(serviceable);
        z.setDeliveryFee(new BigDecimal(fee));
        z.setEtaMinDays((short) 1);
        z.setEtaMaxDays((short) 2);
        z.setPlannedDate(planned);
        z.setIsActive(true);
        return z;
    }

    @Test
    void serviceablePinReturnsMethodsAndFee() {
        when(zones.findServiceableByPinPrefix("302021"))
                .thenReturn(List.of(zone("Jaipur Metro", true, "0", null)));
        ShippingMethod sm = new ShippingMethod();
        sm.setId("SM-0001");
        sm.setName("Standard");
        sm.setBaseFee(new BigDecimal("49"));
        sm.setEtaMinDays((short) 3);
        sm.setEtaMaxDays((short) 5);
        when(shippingMethods.findByIsActiveTrueOrderBySortOrderAsc()).thenReturn(List.of(sm));

        ServiceabilityResponse r = service.isPinServiceable("302021");
        assertThat(r.serviceable()).isTrue();
        assertThat(r.shippingMethods()).hasSize(1);
        assertThat(r.deliveryCharge()).isEqualByComparingTo("0");
    }

    @Test
    void plannedZoneIsNotServiceableButShowsDate() {
        when(zones.findServiceableByPinPrefix("342001")).thenReturn(List.of());
        when(zones.findAnyByPinPrefix("342001"))
                .thenReturn(List.of(zone("Jodhpur", false, "0", LocalDate.parse("2026-12-01"))));
        ServiceabilityResponse r = service.isPinServiceable("342001");
        assertThat(r.serviceable()).isFalse();
        assertThat(r.plannedDate()).isEqualTo("2026-12-01");
    }

    @Test
    void unknownPinNotServiceable() {
        when(zones.findServiceableByPinPrefix("999999")).thenReturn(List.of());
        when(zones.findAnyByPinPrefix("999999")).thenReturn(List.of());
        assertThat(service.isPinServiceable("999999").serviceable()).isFalse();
        assertThat(service.isPinServiceable("12345").serviceable()).isFalse();  // invalid format
    }
}
