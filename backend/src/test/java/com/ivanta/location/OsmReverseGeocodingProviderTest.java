package com.ivanta.location;

import com.ivanta.location.dto.LocationDtos.ReverseGeocodeResponse;
import com.ivanta.location.provider.OsmReverseGeocodingProvider;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OsmReverseGeocodingProviderTest {

    @Test
    void handlesNullCoordinatesGracefully() {
        OsmReverseGeocodingProvider provider = new OsmReverseGeocodingProvider();
        ReverseGeocodeResponse resp = provider.reverseGeocode(null, null, "Default Hint");
        assertThat(resp).isNotNull();
        assertThat(resp.provider()).isEqualTo("osm");
        assertThat(resp.locality()).isEqualTo("Default Hint");
    }

    @Test
    void reportsCorrectProviderName() {
        OsmReverseGeocodingProvider provider = new OsmReverseGeocodingProvider();
        assertThat(provider.providerName()).isEqualTo("osm");
    }
}
