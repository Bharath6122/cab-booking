package com.bharath.cabbooking.service;

import com.bharath.cabbooking.domain.DriverStatus;
import com.bharath.cabbooking.dto.ApiDtos.*;
import com.bharath.cabbooking.entity.Driver;
import com.bharath.cabbooking.repository.CabRepository;
import com.bharath.cabbooking.repository.DriverRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class DriverService {
    private final DriverRepository drivers;
    private final CabRepository cabs;

    public DriverService(DriverRepository drivers, CabRepository cabs) {
        this.drivers = drivers;
        this.cabs = cabs;
    }

    public List<DriverResponse> list(boolean availableOnly) {
        return (availableOnly ? drivers.findByStatus(DriverStatus.AVAILABLE) : drivers.findAll())
                .stream().map(ApiMapper::driver).toList();
    }

    public DriverResponse get(Long id) {
        return ApiMapper.driver(findDriver(id));
    }

    @Transactional
    public DriverResponse create(DriverRequest request) {
        ensureAdminStatus(request.status());
        String license = request.licenseNumber().trim().toUpperCase();
        if (drivers.findByLicenseNumber(license).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "License number already exists");
        }
        return ApiMapper.driver(drivers.save(new Driver(request.fullName().trim(), request.phone().trim(),
                license, request.experienceYears(), request.status())));
    }

    @Transactional
    public DriverResponse update(Long id, DriverRequest request) {
        ensureAdminStatus(request.status());
        Driver driver = findDriver(id);
        if (driver.getStatus() == DriverStatus.ON_TRIP) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A driver on a trip cannot be edited");
        }
        String license = request.licenseNumber().trim().toUpperCase();
        if (drivers.findByLicenseNumber(license).filter(existing -> !existing.getId().equals(id)).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "License number already exists");
        }
        driver.update(request.fullName().trim(), request.phone().trim(), license,
                request.experienceYears(), request.status());
        return ApiMapper.driver(driver);
    }

    @Transactional
    public void delete(Long id) {
        Driver driver = findDriver(id);
        if (driver.getStatus() == DriverStatus.ON_TRIP) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A driver on a trip cannot be deleted");
        }
        if (cabs.existsByAssignedDriver_IdAndIdNot(driver.getId(), -1L)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Unassign this driver from the cab before deleting");
        }
        drivers.delete(driver);
    }

    private Driver findDriver(Long id) {
        return drivers.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
    }

    private void ensureAdminStatus(DriverStatus status) {
        if (status == DriverStatus.ON_TRIP) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "On-trip status is managed by the booking workflow");
        }
    }
}
