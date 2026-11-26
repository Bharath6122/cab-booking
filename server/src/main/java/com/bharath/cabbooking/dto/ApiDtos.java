package com.bharath.cabbooking.dto;

import com.bharath.cabbooking.domain.*;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

public final class ApiDtos {
    private ApiDtos() {}

    public record RegisterRequest(
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotBlank @Pattern(regexp = "^[+0-9() .-]{7,30}$") String phone) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record UserResponse(Long id, String fullName, String email, String phone, Role role, Instant createdAt) {}

    public record AuthResponse(String token, UserResponse user) {}

    public record ProfileRequest(@NotBlank @Size(max = 100) String fullName,
                                 @NotBlank @Pattern(regexp = "^[+0-9() .-]{7,30}$") String phone) {}

    public record CabRequest(
            @NotBlank @Size(max = 80) String cabName,
            @NotNull CabType cabType,
            @NotBlank @Size(max = 30) String registrationNumber,
            @Min(1) @Max(12) int seatingCapacity,
            @DecimalMin("0.01") @DecimalMax("10000.00") double pricePerKm,
            @NotNull CabStatus status,
            @NotNull Long assignedDriverId) {}

    public record CabResponse(Long id, String cabName, CabType cabType, String registrationNumber,
                              int seatingCapacity, double pricePerKm, CabStatus status, Long assignedDriverId,
                              String driverName) {}

    public record DriverRequest(
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Pattern(regexp = "^[+0-9() .-]{7,30}$") String phone,
            @NotBlank @Size(max = 60) String licenseNumber,
            @Min(0) @Max(60) int experienceYears,
            @NotNull DriverStatus status) {}

    public record DriverResponse(Long id, String fullName, String phone, String licenseNumber,
                                 int experienceYears, DriverStatus status, Instant createdAt) {}

    public record BookingRequest(
            @NotNull Long cabId,
            @NotBlank @Size(max = 180) String pickupLocation,
            @NotBlank @Size(max = 180) String dropLocation,
            @DecimalMin("0.1") @DecimalMax("1000.0") double distanceKm,
            @NotNull @FutureOrPresent LocalDateTime bookingDateTime) {}

    public record BookingStatusRequest(@NotNull BookingStatus status) {}

    public record FareQuote(double baseFare, double pricePerKm, double distanceKm, double estimatedFare) {}

    public record BookingResponse(Long id, String bookingReference, Long userId, String customerName,
                                  String customerEmail, Long cabId, String cabName, CabType cabType,
                                  Long driverId, String driverName, String pickupLocation, String dropLocation,
                                  double distanceKm, double estimatedFare, LocalDateTime bookingDateTime,
                                  BookingStatus status, Instant createdAt) {}

    public record DashboardResponse(long totalUsers, long totalDrivers, long totalCabs, long totalBookings,
                                    long completedRides, long cancelledRides, double revenue,
                                    long availableCabs, long availableDrivers, List<BookingResponse> recentBookings) {}

    public record ErrorResponse(String message, Instant timestamp, List<String> details) {}
}
