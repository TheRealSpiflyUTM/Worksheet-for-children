package com.worksheet;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({"/login", "/signup", "/home", "/home/{legacyName}", "/account", "/sheets",
        "/teacher", "/teacher/{id}", "/kids", "/kids/{id}", "/classes", "/classes/{id}",
        "/assignments", "/assignments/{id}", "/attempts/{id}"})
    public String reactRoutes() {
        return "forward:/index.html";
    }
}
