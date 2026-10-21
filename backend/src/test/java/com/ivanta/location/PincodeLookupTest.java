package com.ivanta.location;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.exception.ResourceNotFoundException;
import com.ivanta.config.IvantaProperties;
import com.ivanta.location.dto.PincodeLookupDtos.PincodeLookupResponse;
import com.ivanta.location.provider.PincodeApiProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PincodeLookupTest {

    private HttpClient httpClient;
    private HttpResponse<String> httpResponse;
    private PincodeLookupCacheRepository cacheRepo;
    private ZoneRepository zoneRepo;
    private IvantaProperties properties;
    private PincodeApiProvider provider;
    private ObjectMapper objectMapper;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setup() {
        httpClient = mock(HttpClient.class);
        httpResponse = mock(HttpResponse.class);
        cacheRepo = mock(PincodeLookupCacheRepository.class);
        zoneRepo = mock(ZoneRepository.class);
        properties = new IvantaProperties();
        objectMapper = new ObjectMapper();

        // Default cache miss
        when(cacheRepo.findByPincodeAndExpiresAtAfter(any(), any())).thenReturn(Optional.empty());

        // Default zone: serviceable
        ServiceabilityZone dummyZone = new ServiceabilityZone();
        dummyZone.setName("North Zone");
        when(zoneRepo.findServiceableByPinPrefix(any())).thenReturn(List.of(dummyZone));

        provider = new PincodeApiProvider(httpClient, objectMapper, cacheRepo, zoneRepo, properties);
    }

    @Test
    void rejectsInvalidPincodes() {
        assertThatThrownBy(() -> provider.lookup(null))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(ErrorCode.VALIDATION_ERROR);

        assertThatThrownBy(() -> provider.lookup("123"))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(ErrorCode.VALIDATION_ERROR);

        assertThatThrownBy(() -> provider.lookup("12345"))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(ErrorCode.VALIDATION_ERROR);

        assertThatThrownBy(() -> provider.lookup("1234567"))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(ErrorCode.VALIDATION_ERROR);

        assertThatThrownBy(() -> provider.lookup("ABCDEF"))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(ErrorCode.VALIDATION_ERROR);
    }

    @Test
    void handlesUnknownPincodeNotFound() throws Exception {
        when(httpResponse.statusCode()).thenReturn(404);
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        assertThatThrownBy(() -> provider.lookup("999999"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("999999");
    }

    @Test
    void handlesUpstreamRateLimit429() throws Exception {
        when(httpResponse.statusCode()).thenReturn(429);
        when(httpResponse.body()).thenReturn("{\"error\":\"Too Many Requests\"}");
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        assertThatThrownBy(() -> provider.lookup("302012"))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(ErrorCode.RATE_LIMITED);
    }

    @Test
    void handlesUpstreamTimeout() throws Exception {
        doThrow(new HttpTimeoutException("request timed out"))
                .when(httpClient).send(any(HttpRequest.class), any());

        assertThatThrownBy(() -> provider.lookup("302012"))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(ErrorCode.SERVICE_UNAVAILABLE);
    }

    @Test
    void handlesUpstreamNetworkError() throws Exception {
        doThrow(new IOException("Connection refused"))
                .when(httpClient).send(any(HttpRequest.class), any());

        assertThatThrownBy(() -> provider.lookup("302012"))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(ErrorCode.SERVICE_UNAVAILABLE);
    }

    @Test
    void parsesValidResponseWithSingleUnambiguousPostOffice() throws Exception {
        String json = """
            {
              "success": true,
              "data": {
                "pincode": "110001",
                "post_offices": [
                  {
                    "id": 1,
                    "office_name": "Connaught Place",
                    "office_type": "PO",
                    "delivery_status": "Delivery",
                    "district": "Central Delhi",
                    "state": "Delhi"
                  }
                ]
              }
            }
            """;

        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(json);
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        PincodeLookupResponse res = provider.lookup("110001");

        assertThat(res.pincode()).isEqualTo("110001");
        assertThat(res.isUnambiguous()).isTrue();
        assertThat(res.district()).isEqualTo("Central Delhi");
        assertThat(res.state()).isEqualTo("Delhi");
        assertThat(res.districts()).containsExactly("Central Delhi");
        assertThat(res.states()).containsExactly("Delhi");
        assertThat(res.postOffices()).hasSize(1);
        assertThat(res.postOffices().get(0).name()).isEqualTo("Connaught Place");
        assertThat(res.postOffices().get(0).officeType()).isEqualTo("PO");
        assertThat(res.serviceable()).isTrue();

        verify(cacheRepo, times(1)).save(any(PincodeLookupCache.class));
    }

    @Test
    void handlesMultiplePostOfficesWithSameDistrictUnambiguous() throws Exception {
        String json = """
            {
              "success": true,
              "data": {
                "pincode": "302012",
                "post_offices": [
                  {
                    "office_name": "Jhotwara S.O",
                    "district": "Jaipur",
                    "state": "Rajasthan",
                    "office_type": "PO",
                    "delivery_status": "Delivery"
                  },
                  {
                    "office_name": "Khatipura S.O",
                    "district": "Jaipur",
                    "state": "Rajasthan",
                    "office_type": "PO",
                    "delivery_status": "Non Delivery"
                  }
                ]
              }
            }
            """;

        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(json);
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        PincodeLookupResponse res = provider.lookup("302012");

        assertThat(res.pincode()).isEqualTo("302012");
        assertThat(res.isUnambiguous()).isTrue();
        assertThat(res.district()).isEqualTo("Jaipur");
        assertThat(res.state()).isEqualTo("Rajasthan");
        assertThat(res.postOffices()).hasSize(2);
        assertThat(res.postOffices()).extracting("name").containsExactly("Jhotwara S.O", "Khatipura S.O");
    }

    @Test
    void handlesAmbiguousDistrictsRequiringUserChoice() throws Exception {
        String json = """
            {
              "success": true,
              "data": {
                "pincode": "123456",
                "post_offices": [
                  {
                    "office_name": "Border Office A",
                    "district": "District Alpha",
                    "state": "State One"
                  },
                  {
                    "office_name": "Border Office B",
                    "district": "District Beta",
                    "state": "State One"
                  }
                ]
              }
            }
            """;

        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(json);
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        PincodeLookupResponse res = provider.lookup("123456");

        assertThat(res.pincode()).isEqualTo("123456");
        assertThat(res.isUnambiguous()).isFalse();
        assertThat(res.district()).isNull(); // ambiguous! user must pick
        assertThat(res.districts()).containsExactly("District Alpha", "District Beta");
        assertThat(res.postOffices()).hasSize(2);
    }

    @Test
    void handlesMissingOptionalFieldsGracefully() throws Exception {
        String json = """
            {
              "success": true,
              "data": {
                "pincode": "560001",
                "post_offices": [
                  {
                    "office_name": "Bangalore G.P.O.",
                    "district": "Bangalore",
                    "state": "Karnataka"
                  }
                ]
              }
            }
            """;

        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(json);
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        PincodeLookupResponse res = provider.lookup("560001");

        assertThat(res.pincode()).isEqualTo("560001");
        assertThat(res.postOffices().get(0).name()).isEqualTo("Bangalore G.P.O.");
        assertThat(res.postOffices().get(0).officeType()).isEmpty();
        assertThat(res.postOffices().get(0).deliveryStatus()).isEmpty();
    }

    @Test
    void returnsCachedResponseWithoutCallingHttpClient() throws Exception {
        String cachedJson = """
            {
              "success": true,
              "data": {
                "pincode": "400001",
                "post_offices": [
                  {
                    "office_name": "Mumbai G.P.O.",
                    "district": "Mumbai",
                    "state": "Maharashtra"
                  }
                ]
              }
            }
            """;

        PincodeLookupCache cached = new PincodeLookupCache("400001", cachedJson, "Mumbai", "Maharashtra", Instant.now().plusSeconds(3600));
        when(cacheRepo.findByPincodeAndExpiresAtAfter(eq("400001"), any())).thenReturn(Optional.of(cached));

        PincodeLookupResponse res = provider.lookup("400001");

        assertThat(res.pincode()).isEqualTo("400001");
        assertThat(res.district()).isEqualTo("Mumbai");
        verify(httpClient, never()).send(any(), any());
    }
}
