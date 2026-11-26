package com.bharath.cabbooking.service;

import com.bharath.cabbooking.domain.*;
import com.bharath.cabbooking.dto.ApiDtos.*;
import com.bharath.cabbooking.entity.*;
import com.bharath.cabbooking.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BookingServiceTest {
    private BookingRepository bookings;
    private CabRepository cabs;
    private UserRepository users;
    private DriverRepository drivers;
    private BookingService service;
    private UserAccount rider;
    private Driver driver;
    private Cab cab;

    @BeforeEach
    void setUp() {
        bookings = mock(BookingRepository.class);
        cabs = mock(CabRepository.class);
        users = mock(UserRepository.class);
        drivers = mock(DriverRepository.class);
        service = new BookingService(bookings, cabs, users, drivers, 100);
        rider = new UserAccount("Rider", "rider@example.com", "hashed", "+911234567890", Role.ROLE_USER);
        driver = new Driver("Driver", "+919876543210", "LIC-1", 5, DriverStatus.AVAILABLE);
        cab = new Cab("City Car", CabType.SEDAN, "CB-01-AA-1234", 4, 17,
                CabStatus.AVAILABLE, driver);
        when(users.findByEmail("rider@example.com")).thenReturn(Optional.of(rider));
        when(cabs.findLockedById(1L)).thenReturn(Optional.of(cab));
        when(bookings.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void calculatesFareOnServerAndReservesTheCabAndDriver() {
        BookingResponse response = service.create(
                "rider@example.com",
                new BookingRequest(1L, "Start", "Finish", 10, LocalDateTime.now().plusHours(1)));

        assertEquals(270.0, response.estimatedFare());
        assertEquals(CabStatus.BOOKED, cab.getStatus());
        assertEquals(DriverStatus.ON_TRIP, driver.getStatus());
        verify(bookings).save(any(Booking.class));
    }

    @Test
    void rejectsUnavailableVehiclesWithoutCreatingABooking() {
        cab.setStatus(CabStatus.BOOKED);

        assertThrows(ResponseStatusException.class, () -> service.create(
                "rider@example.com",
                new BookingRequest(1L, "Start", "Finish", 10, LocalDateTime.now().plusHours(1))));
        verify(bookings, never()).save(any(Booking.class));
    }

    @Test
    void preventsCustomersFromReadingAnotherRidersBooking() {
        Booking booking = new Booking(
                new UserAccount("Other Rider", "other@example.com", "hashed", "+911234567891", Role.ROLE_USER),
                driver, cab, "Start", "Finish", 10, 270, LocalDateTime.now().plusHours(1));
        when(bookings.findById(42L)).thenReturn(Optional.of(booking));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> service.getMine("rider@example.com", 42L, false));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    @Test
    void completingARideReleasesItsVehicleAndDriver() {
        Booking booking = new Booking(rider, driver, cab, "Start", "Finish", 10, 270,
                LocalDateTime.now().plusHours(1));
        booking.setStatus(BookingStatus.IN_PROGRESS);
        cab.setStatus(CabStatus.BOOKED);
        driver.setStatus(DriverStatus.ON_TRIP);
        when(bookings.findById(1L)).thenReturn(Optional.of(booking));

        BookingResponse response = service.updateStatus(1L, BookingStatus.COMPLETED);

        assertEquals(BookingStatus.COMPLETED, response.status());
        assertEquals(CabStatus.AVAILABLE, cab.getStatus());
        assertEquals(DriverStatus.AVAILABLE, driver.getStatus());
    }

}
