package in.floodresponse.gateway.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * When the gateway serves the web apps, their client-side routes must all return the
 * app's index.html. Static files (assets, service worker) are served as they are.
 */
@Controller
class SpaController {

    @GetMapping({"/", "/map", "/sos", "/assistant", "/donate", "/safety", "/shelters", "/request/{id}"})
    String citizen() {
        return "forward:/index.html";
    }

    @GetMapping({"/admin", "/admin/", "/admin/teams"})
    String controlRoom() {
        return "forward:/admin/index.html";
    }
}
