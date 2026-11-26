package com.bharath.cabbooking.controller;

import com.bharath.cabbooking.dto.ApiDtos.*;
import com.bharath.cabbooking.service.DriverService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {
    private final DriverService drivers;

    public DriverController(DriverService drivers) {
        this.drivers = drivers;
    }

    @GetMapping
    public List<DriverResponse> list() { return drivers.list(false); }

    @GetMapping("/available")
    public List<DriverResponse> available() { return drivers.list(true); }

    @GetMapping("/{id}")
    public DriverResponse get(@PathVariable Long id) { return drivers.get(id); }

    @PostMapping
    public DriverResponse create(@Valid @RequestBody DriverRequest request) { return drivers.create(request); }

    @PutMapping("/{id}")
    public DriverResponse update(@PathVariable Long id, @Valid @RequestBody DriverRequest request) {
        return drivers.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { drivers.delete(id); }
}
