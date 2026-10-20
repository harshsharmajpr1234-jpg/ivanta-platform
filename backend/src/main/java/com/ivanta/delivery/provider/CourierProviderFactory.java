package com.ivanta.delivery.provider;

import com.ivanta.config.IvantaProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
public class CourierProviderFactory {

    private final IvantaProperties props;
    private final Map<String, CourierProvider> providers;
    private final MockCourierProvider mockProvider;

    public CourierProviderFactory(IvantaProperties props, List<CourierProvider> providerList, MockCourierProvider mockProvider) {
        this.props = props;
        this.mockProvider = mockProvider;
        this.providers = providerList.stream().collect(Collectors.toMap(CourierProvider::getName, Function.identity()));
    }

    /** Returns active CourierProvider resolved from ivanta.delivery.provider configuration. */
    public CourierProvider getActiveProvider() {
        String configuredName = props.getDelivery().getProvider();
        return getProvider(configuredName);
    }

    /** Returns CourierProvider by name (mock | shiprocket | delhivery). */
    public CourierProvider getProvider(String name) {
        if (name == null || name.isBlank()) {
            return mockProvider;
        }
        CourierProvider p = providers.get(name.toLowerCase().trim());
        if (p == null) {
            log.warn("[COURIER FACTORY] Configured courier provider '{}' not found, falling back to mock provider", name);
            return mockProvider;
        }
        return p;
    }
}
