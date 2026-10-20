package com.ivanta.location;

import com.ivanta.location.dto.LocationDtos.PincodeInfo;
import com.ivanta.location.provider.IndiaPostPincodeProvider;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class IndiaPostPincodeProviderTest {

    @Test
    void rejectsInvalidPincodeFormats() {
        IndiaPostPincodeProvider provider = new IndiaPostPincodeProvider();
        assertThat(provider.lookupPincode(null)).isNull();
        assertThat(provider.lookupPincode("12345")).isNull();
        assertThat(provider.lookupPincode("ABCDEF")).isNull();
    }
}
