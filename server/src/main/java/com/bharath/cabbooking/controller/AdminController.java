package com.bharath.cabbooking.controller;

import com.bharath.cabbooking.dto.ApiDtos.DashboardResponse;
import com.bharath.cabbooking.service.BookingService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminController {
    private final BookingService bookings;

    public AdminController(BookingService bookings) {
        this.bookings = bookings;
    }

    @GetMapping("/stats")
    public DashboardResponse stats() { return bookings.dashboard(); }
}
