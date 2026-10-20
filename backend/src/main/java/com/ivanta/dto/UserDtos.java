package com.ivanta.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public final class UserDtos {
    private UserDtos() { }

    public record AddressRequest(@NotBlank @Size(max = 120) String name,
                                 @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit mobile number") String phone,
                                 @NotBlank @Size(max = 200) String addressLine1,
                                 @Size(max = 200) String addressLine2,
                                 @Size(max = 120) String locality,
                                 @Size(max = 120) String road,
                                 @NotBlank @Size(max = 80) String city,
                                 @Size(max = 80) String district,
                                 @NotBlank @Size(max = 80) String state,
                                 @NotBlank @Pattern(regexp = "\\d{6}", message = "PIN code must be 6 digits") String pincode,
                                 BigDecimal latitude, BigDecimal longitude,
                                 @Size(max = 200) String landmark,
                                 @Pattern(regexp = "HOME|WORK|OTHER") String addressType,
                                 Boolean isDefault) { }

    public record AddressView(String id, String name, String phone, String addressLine1, String addressLine2,
                              String locality, String road, String city, String district, String state,
                              String pincode, String country, String landmark, String addressType,
                              boolean isDefault, BigDecimal latitude, BigDecimal longitude) { }

    public record ProfileUpdate(@Size(max = 120) String name, Boolean marketingEmails, Boolean marketingSms) { }
}
