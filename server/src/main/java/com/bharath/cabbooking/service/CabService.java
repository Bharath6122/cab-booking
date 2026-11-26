package com.bharath.cabbooking.service;

import com.bharath.cabbooking.domain.CabStatus;
import com.bharath.cabbooking.domain.DriverStatus;
import com.bharath.cabbooking.dto.ApiDtos.*;
import com.bharath.cabbooking.entity.Cab;
import com.bharath.cabbooking.entity.Driver;
import com.bharath.cabbooking.repository.CabRepository;
import com.bharath.cabbooking.repository.DriverRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class CabService {
    private final CabRepository cabs;
    private final DriverRepository drivers;

    public CabService(CabRepository cabs, DriverRepository drivers) {
        this.cabs = cabs;
        this.drivers = drivers;
    }

    public List<CabResponse> list(boolean availableOnly) {
        return (availableOnly ? cabs.findByStatus(CabStatus.AVAILABLE) : cabs.findAll())
                .stream().map(ApiMapper::cab).toList();
    }

    public CabResponse get(Long id) {
        return ApiMapper.cab(findCab(id));
    }

    @Transactional
    public CabResponse create(CabRequest request) {
        ensureAdminStatus(request.status());
        Driver driver = findDriver(request.assignedDriverId());
        if (driver.getStatus() != DriverStatus.AVAILABLE || cabs.existsByAssignedDriver_IdAndIdNot(driver.getId(), -1L)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Driver is unavailable or already assigned");
        }
        return ApiMapper.cab(cabs.save(new Cab(request.cabName().trim(), request.cabType(),
                request.registrationNumber().trim().toUpperCase(), request.seatingCapacity(),
                request.pricePerKm(), request.status(), driver)));
    }

    @Transactional
    public CabResponse update(Long id, CabRequest request) {
        ensureAdminStatus(request.status());
        Cab cab = findCab(id);
        if (cab.getStatus() == CabStatus.BOOKED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A booked cab cannot be edited");
        }
        Driver driver = findDriver(request.assignedDriverId());
        if (driver.getStatus() != DriverStatus.AVAILABLE
                || cabs.existsByAssignedDriver_IdAndIdNot(driver.getId(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Driver is unavailable or already assigned");
        }
        cab.update(request.cabName().trim(), request.cabType(), request.registrationNumber().trim().toUpperCase(),
                request.seatingCapacity(), request.pricePerKm(), request.status(), driver);
        return ApiMapper.cab(cab);
    }

    @Transactional
    public void delete(Long id) {
        Cab cab = findCab(id);
        if (cab.getStatus() == CabStatus.BOOKED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A booked cab cannot be deleted");
        }
        cabs.delete(cab);
    }

    private Cab findCab(Long id) {
        return cabs.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cab not found"));
    }

    private Driver findDriver(Long id) {
        return drivers.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
    }

    private void ensureAdminStatus(CabStatus status) {
        if (status == CabStatus.BOOKED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booked status is managed by the booking workflow");
        }
    }
}
