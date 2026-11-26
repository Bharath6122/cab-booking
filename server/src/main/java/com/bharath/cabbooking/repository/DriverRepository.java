package com.bharath.cabbooking.repository;

import com.bharath.cabbooking.domain.DriverStatus;
import com.bharath.cabbooking.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DriverRepository extends JpaRepository<Driver, Long> {
    List<Driver> findByStatus(DriverStatus status);
    Optional<Driver> findByLicenseNumber(String licenseNumber);
}
