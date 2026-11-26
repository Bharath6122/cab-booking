package com.bharath.cabbooking.service;

import com.bharath.cabbooking.domain.*;
import com.bharath.cabbooking.dto.ApiDtos.*;
import com.bharath.cabbooking.entity.*;
import com.bharath.cabbooking.repository.*;
import com.bharath.cabbooking.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class BookingService {
    private final BookingRepository bookings;
    private final CabRepository cabs;
    private final UserRepository users;
    private final DriverRepository drivers;
    private final double baseFare;

    public BookingService(BookingRepository bookings, CabRepository cabs, UserRepository users,
                          DriverRepository drivers,
                          @Value("${app.fare.base}") double baseFare) {
        this.bookings = bookings;
        this.cabs = cabs;
        this.users = users;
        this.drivers = drivers;
        this.baseFare = baseFare;
    }

    @Transactional
    public BookingResponse create(String email, BookingRequest request) {
        UserAccount user = findUser(email);
        Cab cab = cabs.findLockedById(request.cabId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cab not found"));
        Driver driver = cab.getAssignedDriver();
        if (cab.getStatus() != CabStatus.AVAILABLE || driver == null
                || driver.getStatus() != DriverStatus.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cab or driver is unavailable");
        }
        double fare = Math.round((baseFare + request.distanceKm() * cab.getPricePerKm()) * 100.0) / 100.0;
        Booking booking = bookings.save(new Booking(user, driver, cab, request.pickupLocation().trim(),
                request.dropLocation().trim(), request.distanceKm(), fare, request.bookingDateTime()));
        cab.setStatus(CabStatus.BOOKED);
        driver.setStatus(DriverStatus.ON_TRIP);
        return ApiMapper.booking(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> mine(String email) {
        UserAccount user = findUser(email);
        return bookings.findByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(ApiMapper::booking).toList();
    }

    @Transactional(readOnly = true)
    public BookingResponse getMine(String email, Long id, boolean admin) {
        Booking booking = findBooking(id);
        if (!admin && !booking.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access another user's booking");
        }
        return ApiMapper.booking(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> listAll() {
        return bookings.findAllByOrderByCreatedAtDesc().stream().map(ApiMapper::booking).toList();
    }

    @Transactional
    public BookingResponse cancelMine(String email, Long id) {
        Booking booking = findBooking(id);
        if (!booking.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot cancel another user's booking");
        }
        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending or confirmed bookings can be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        releaseVehicle(booking);
        return ApiMapper.booking(booking);
    }

    @Transactional
    public BookingResponse updateStatus(Long id, BookingStatus next) {
        Booking booking = findBooking(id);
        BookingStatus current = booking.getStatus();
        boolean valid = switch (current) {
            case PENDING -> next == BookingStatus.CONFIRMED || next == BookingStatus.CANCELLED;
            case CONFIRMED -> next == BookingStatus.IN_PROGRESS || next == BookingStatus.CANCELLED;
            case IN_PROGRESS -> next == BookingStatus.COMPLETED;
            case COMPLETED, CANCELLED -> false;
        };
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Invalid booking status transition from " + current + " to " + next);
        }
        booking.setStatus(next);
        if (next == BookingStatus.CANCELLED || next == BookingStatus.COMPLETED) {
            releaseVehicle(booking);
        }
        return ApiMapper.booking(booking);
    }

    private void releaseVehicle(Booking booking) {
        booking.getCab().setStatus(CabStatus.AVAILABLE);
        booking.getDriver().setStatus(DriverStatus.AVAILABLE);
    }

    @Transactional(readOnly = true)
    public DashboardResponse dashboard() {
        List<BookingResponse> recent = bookings.findTop8ByOrderByCreatedAtDesc()
                .stream().map(ApiMapper::booking).toList();
        return new DashboardResponse(users.count(), drivers.count(), cabs.count(), bookings.count(),
                bookings.countByStatus(BookingStatus.COMPLETED), bookings.countByStatus(BookingStatus.CANCELLED),
                bookings.sumFareByStatus(BookingStatus.COMPLETED), cabs.findByStatus(CabStatus.AVAILABLE).size(),
                drivers.findByStatus(DriverStatus.AVAILABLE).size(), recent);
    }

    private Booking findBooking(Long id) {
        return bookings.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }

    private UserAccount findUser(String email) {
        return users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
