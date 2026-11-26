package com.bharath.cabbooking.service;

import com.bharath.cabbooking.dto.ApiDtos.*;
import com.bharath.cabbooking.entity.*;

public final class ApiMapper {
    private ApiMapper() {}

    public static UserResponse user(UserAccount user) {
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(),
                user.getRole(), user.getCreatedAt());
    }

    public static CabResponse cab(Cab cab) {
        Driver driver = cab.getAssignedDriver();
        return new CabResponse(cab.getId(), cab.getCabName(), cab.getCabType(), cab.getRegistrationNumber(),
                cab.getSeatingCapacity(), cab.getPricePerKm(), cab.getStatus(),
                driver == null ? null : driver.getId(), driver == null ? null : driver.getFullName());
    }

    public static DriverResponse driver(Driver driver) {
        return new DriverResponse(driver.getId(), driver.getFullName(), driver.getPhone(),
                driver.getLicenseNumber(), driver.getExperienceYears(), driver.getStatus(), driver.getCreatedAt());
    }

    public static BookingResponse booking(Booking booking) {
        return new BookingResponse(booking.getId(), booking.getBookingReference(), booking.getUser().getId(),
                booking.getUser().getFullName(), booking.getUser().getEmail(), booking.getCab().getId(),
                booking.getCab().getCabName(), booking.getCab().getCabType(), booking.getDriver().getId(),
                booking.getDriver().getFullName(), booking.getPickupLocation(), booking.getDropLocation(),
                booking.getDistanceKm(), booking.getEstimatedFare(), booking.getBookingDateTime(),
                booking.getStatus(), booking.getCreatedAt());
    }
}
