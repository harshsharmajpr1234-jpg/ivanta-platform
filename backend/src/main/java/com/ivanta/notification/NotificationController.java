package com.ivanta.notification;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.security.CustomerPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    public record NotificationView(String id, String title, String body, String entityType,
                                   String entityId, boolean read, String createdAt) { }

    @GetMapping
    public ApiResponse<Map<String, Object>> list(@AuthenticationPrincipal CustomerPrincipal me,
                                                 @RequestParam(defaultValue = "30") int limit) {
        List<NotificationView> rows = service.inbox(me.userId(), limit).stream()
                .map(n -> new NotificationView(n.getId(), n.getTitle(), n.getBody(), n.getEntityType(),
                        n.getEntityId(), n.getReadAt() != null, n.getCreatedAt().toString()))
                .toList();
        return ApiResponse.ok(Map.of("notifications", rows, "unreadCount", service.unread(me.userId())));
    }

    @RequestMapping(value = "/{id}/read", method = {RequestMethod.POST, RequestMethod.PATCH})
    public ApiResponse<Void> read(@AuthenticationPrincipal CustomerPrincipal me, @PathVariable String id) {
        service.markRead(me.userId(), id);
        return ApiResponse.ok();
    }

    @PostMapping("/read-all")
    public ApiResponse<Void> readAll(@AuthenticationPrincipal CustomerPrincipal me) {
        service.markAllRead(me.userId());
        return ApiResponse.ok();
    }
}
