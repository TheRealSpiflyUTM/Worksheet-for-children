package com.worksheet.auth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthSessionService {
    private static final String USER_ID = "auth.userId";

    public Long requireUserId(HttpServletRequest request) {
        var session = request.getSession(false);
        if(session == null || !(session.getAttribute(USER_ID) instanceof Long id)) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in.");
        return id;
    }

    public void setUserId(HttpServletRequest request, Long userId) {
        request.getSession().setAttribute(USER_ID, userId);
    }
}