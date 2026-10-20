package com.ivanta.notification;

import com.ivanta.auth.User;
import com.ivanta.auth.UserRepository;
import com.ivanta.common.util.IdService;
import com.ivanta.notification.provider.NotificationProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Notifications (§42): renders templates, persists an in-app row and dispatches
 * through every configured channel provider. Failures in one channel never
 * break the business transaction.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notifications;
    private final NotificationTemplateRepository templates;
    private final UserRepository users;
    private final List<NotificationProvider> providers;
    private final IdService ids;

    @Transactional
    public void notifyUser(String userId, String templateKey, Map<String, String> vars,
                           String entityType, String entityId) {
        NotificationTemplate t = templates.findById(templateKey).orElse(null);
        String title = t != null ? render(t.getSubject(), vars) : templateKey;
        String body = t != null ? render(t.getBody(), vars) : String.valueOf(vars);

        Notification n = new Notification();
        n.setId(ids.next("notifications", "NTF", 6));
        n.setUserId(userId);
        n.setTemplateKey(templateKey);
        n.setChannel("IN_APP");
        n.setTitle(truncate(title, 160));
        n.setBody(truncate(body, 600));
        n.setEntityType(entityType);
        n.setEntityId(entityId);
        notifications.save(n);

        String email = users.findById(userId).map(User::getEmail).orElse(null);
        String phone = users.findById(userId).map(User::getPhone).orElse(null);
        for (NotificationProvider p : providers) {
            try {
                String recipient = switch (p.channel()) {
                    case "EMAIL" -> email;
                    case "SMS", "WHATSAPP" -> phone;
                    default -> userId;
                };
                if (recipient != null) p.send(recipient, title, body);
            } catch (Exception e) {
                log.warn("Notification channel {} failed for {}: {}", p.channel(), templateKey, e.getMessage());
            }
        }
    }

    public static String render(String template, Map<String, String> vars) {
        String out = template;
        for (Map.Entry<String, String> e : vars.entrySet())
            out = out.replace("{{" + e.getKey() + "}}", e.getValue() == null ? "" : e.getValue());
        return out;
    }

    private String truncate(String s, int max) {
        return s != null && s.length() > max ? s.substring(0, max) : s;
    }

    /* ---------- customer inbox ---------- */

    @Transactional(readOnly = true)
    public List<Notification> inbox(String userId, int limit) {
        return notifications.findByUserIdOrderByIdDesc(userId,
                org.springframework.data.domain.PageRequest.of(0, Math.min(limit, 100)));
    }

    @Transactional(readOnly = true)
    public long unread(String userId) {
        return notifications.countByUserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public void markRead(String userId, String id) {
        notifications.findById(id).filter(n -> userId.equals(n.getUserId())).ifPresent(n -> {
            if (n.getReadAt() == null) { n.setReadAt(Instant.now()); notifications.save(n); }
        });
    }

    @Transactional
    public void markAllRead(String userId) {
        notifications.markAllRead(userId, Instant.now());
    }
}
