package com.ivanta.admin;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "system_settings")
@Getter @Setter
public class SystemSetting {
    @Id
    @Column(name = "setting_key", length = 60)
    private String settingKey;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;

    @Column(nullable = false, length = 30)
    private String category = "GENERAL";

    @Column(length = 255)
    private String description;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    @Column(name = "updated_by", length = 16)
    private String updatedBy;
}
