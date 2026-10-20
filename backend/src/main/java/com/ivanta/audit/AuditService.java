package com.ivanta.audit;

import com.ivanta.common.util.IdService;
import com.ivanta.security.AdminPrincipal;
import com.ivanta.security.CustomerPrincipal;
import com.ivanta.security.SessionCookieService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Writes immutable audit events (§30): who (actor + role), what (action),
 * where (entity type/id), old -> new values, IP and user agent.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository repo;
    private final IdService ids;

    @Transactional(propagation = Propagation.REQUIRED)
    public void record(String action, String entityType, String entityId, String oldValue, String newValue) {
        AuditLog log = new AuditLog();
        log.setId(ids.next("audit_logs", "AUD", 6));
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setOldValue(truncate(oldValue, 60000));
        log.setNewValue(truncate(newValue, 60000));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth == null ? null : auth.getPrincipal();
        if (principal instanceof AdminPrincipal a) {
            log.setActorType(AuditLog.ActorType.ADMIN);
            log.setActorUserId(a.adminId());
            log.setActorName(a.name());
            log.setActorRole(a.role());
        } else if (principal instanceof CustomerPrincipal c) {
            log.setActorType(AuditLog.ActorType.CUSTOMER);
            log.setActorUserId(c.userId());
            log.setActorName(c.name());
        } else {
            log.setActorType(AuditLog.ActorType.SYSTEM);
            log.setActorName("system");
        }

        HttpServletRequest req = currentRequest();
        if (req != null) {
            log.setIpAddress(SessionCookieService.clientIp(req));
            log.setUserAgent(SessionCookieService.userAgent(req));
        }
        repo.save(log);
    }

    private HttpServletRequest currentRequest() {
        var attrs = RequestContextHolder.getRequestAttributes();
        return attrs instanceof ServletRequestAttributes sra ? sra.getRequest() : null;
    }

    private String truncate(String s, int max) {
        return s != null && s.length() > max ? s.substring(0, max) : s;
    }
}
