package com.worksheet.auth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthSessionService {
    private static final String USER_ID = "auth.userId";
    private final UserRepository users;

    public AuthSessionService(UserRepository users) {
        this.users = users;
    }

    public Long requireUserId(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof String principal) {
            try { return Long.valueOf(principal); }
            catch (NumberFormatException ignored) { }
        }
        var session = request.getSession(false);
        if(session == null || !(session.getAttribute(USER_ID) instanceof Long id)) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in.");
        return id;
    }

    public User requireUser(HttpServletRequest request) {
        return users.findById(requireUserId(request))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in."));
    }

    public User requireRole(HttpServletRequest request, UserRole role) {
        User user = requireUser(request);
        if(user.getRole() != role) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account does not have permission for this action.");
        return user;
    }

    public void setUserId(HttpServletRequest request, Long userId) {
        request.getSession().setAttribute(USER_ID, userId);
    }
}
