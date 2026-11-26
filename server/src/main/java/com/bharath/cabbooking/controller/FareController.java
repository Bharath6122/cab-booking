package com.bharath.cabbooking.controller;

import com.bharath.cabbooking.dto.ApiDtos.FareQuote;
import com.bharath.cabbooking.service.FareService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fares")
public class FareController {
    private final FareService fares;

    public FareController(FareService fares) {
        this.fares = fares;
    }

    @GetMapping("/estimate")
    public FareQuote estimate(@RequestParam Long cabId, @RequestParam double distanceKm) {
        return fares.estimate(cabId, distanceKm);
    }
}
