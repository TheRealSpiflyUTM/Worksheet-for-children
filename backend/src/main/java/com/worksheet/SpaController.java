package com.worksheet;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

<<<<<<< HEAD
    @GetMapping({"/teacher", "/kids", "/sheets"})
=======
    @GetMapping({"/teacher", "/kids"})
>>>>>>> origin/main
    public String reactRoutes() {
        return "forward:/index.html";
    }
}