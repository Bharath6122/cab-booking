package com.bharath.cabbooking.service;

import com.bharath.cabbooking.domain.CabStatus;
import com.bharath.cabbooking.dto.ApiDtos.FareQuote;
import com.bharath.cabbooking.entity.Cab;
import com.bharath.cabbooking.repository.CabRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FareService {
    private final CabRepository cabs;
    private final double baseFare;

    public FareService(CabRepository cabs, @Value("${app.fare.base}") double baseFare) {
        this.cabs = cabs;
        this.baseFare = baseFare;
    }

    public FareQuote estimate(Long cabId, double distanceKm) {
        if (!Double.isFinite(distanceKm) || distanceKm < 0.1 || distanceKm > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Distance must be between 0.1 and 1000 km");
        }
        Cab cab = cabs.findById(cabId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cab not found"));
        if (cab.getStatus() != CabStatus.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cab is unavailable");
        }
        double fare = Math.round((baseFare + distanceKm * cab.getPricePerKm()) * 100.0) / 100.0;
        return new FareQuote(baseFare, cab.getPricePerKm(), distanceKm, fare);
    }
}
