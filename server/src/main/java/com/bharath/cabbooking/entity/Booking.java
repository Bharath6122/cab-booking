package com.bharath.cabbooking.entity;

import com.bharath.cabbooking.domain.BookingStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bookings", uniqueConstraints = @UniqueConstraint(columnNames = "booking_reference"))
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_reference", nullable = false, unique = true, length = 40)
    private String bookingReference = "CB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private UserAccount user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Driver driver;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Cab cab;

    @Column(nullable = false, length = 180)
    private String pickupLocation;

    @Column(nullable = false, length = 180)
    private String dropLocation;

    @Column(nullable = false)
    private double distanceKm;

    @Column(nullable = false)
    private double estimatedFare;

    @Column(nullable = false)
    private LocalDateTime bookingDateTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status = BookingStatus.CONFIRMED;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Booking() {}

    public Booking(UserAccount user, Driver driver, Cab cab, String pickupLocation, String dropLocation,
                   double distanceKm, double estimatedFare, LocalDateTime bookingDateTime) {
        this.user = user;
        this.driver = driver;
        this.cab = cab;
        this.pickupLocation = pickupLocation;
        this.dropLocation = dropLocation;
        this.distanceKm = distanceKm;
        this.estimatedFare = estimatedFare;
        this.bookingDateTime = bookingDateTime;
    }

    public Long getId() { return id; }
    public String getBookingReference() { return bookingReference; }
    public UserAccount getUser() { return user; }
    public Driver getDriver() { return driver; }
    public Cab getCab() { return cab; }
    public String getPickupLocation() { return pickupLocation; }
    public String getDropLocation() { return dropLocation; }
    public double getDistanceKm() { return distanceKm; }
    public double getEstimatedFare() { return estimatedFare; }
    public LocalDateTime getBookingDateTime() { return bookingDateTime; }
    public BookingStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setStatus(BookingStatus status) { this.status = status; }
}
