package com.bharath.cabbooking.repository;

import com.bharath.cabbooking.domain.BookingStatus;
import com.bharath.cabbooking.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Booking> findAllByOrderByCreatedAtDesc();
    List<Booking> findTop8ByOrderByCreatedAtDesc();
    long countByStatus(BookingStatus status);
    boolean existsByUserId(Long userId);

    @Query("select coalesce(sum(b.estimatedFare), 0) from Booking b where b.status = :status")
    double sumFareByStatus(@Param("status") BookingStatus status);
}
