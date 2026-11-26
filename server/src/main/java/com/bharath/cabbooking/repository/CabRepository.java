package com.bharath.cabbooking.repository;

import com.bharath.cabbooking.domain.CabStatus;
import com.bharath.cabbooking.domain.CabType;
import com.bharath.cabbooking.entity.Cab;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CabRepository extends JpaRepository<Cab, Long> {
    List<Cab> findByStatus(CabStatus status);
    List<Cab> findByStatusAndCabType(CabStatus status, CabType cabType);
    boolean existsByAssignedDriver_IdAndIdNot(Long driverId, Long cabId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Cab c where c.id = :id")
    Optional<Cab> findLockedById(@Param("id") Long id);
}
