package com.ivanta.notification;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "notification_templates")
@Getter @Setter
public class NotificationTemplate {
    @Id
    @Column(name = "template_key", length = 40)
    private String templateKey;

    @Column(nullable = false, length = 10)
    private String channel = "IN_APP";

    @Column(nullable = false, length = 160)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
