package com.worksheet;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({"/teacher", "/kids", "/sheets"})
    public String reactRoutes() {
        return "forward:/index.html";
    }
}