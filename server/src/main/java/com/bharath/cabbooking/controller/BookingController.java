package com.bharath.cabbooking.controller;

import com.bharath.cabbooking.dto.ApiDtos.*;
import com.bharath.cabbooking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingService bookings;

    public BookingController(BookingService bookings) {
        this.bookings = bookings;
    }

    @PostMapping
    public BookingResponse create(Authentication authentication, @Valid @RequestBody BookingRequest request) {
        return bookings.create(authentication.getName(), request);
    }

    @GetMapping("/my")
    public List<BookingResponse> mine(Authentication authentication) {
        return bookings.mine(authentication.getName());
    }

    @GetMapping("/{id}")
    public BookingResponse get(Authentication authentication, @PathVariable Long id) {
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        return bookings.getMine(authentication.getName(), id, admin);
    }

    @GetMapping
    public List<BookingResponse> listAll() { return bookings.listAll(); }

    @PatchMapping("/{id}/status")
    public BookingResponse updateStatus(@PathVariable Long id, @Valid @RequestBody BookingStatusRequest request) {
        return bookings.updateStatus(id, request.status());
    }

    @PatchMapping("/{id}/cancel")
    public BookingResponse cancel(Authentication authentication, @PathVariable Long id) {
        return bookings.cancelMine(authentication.getName(), id);
    }
}
