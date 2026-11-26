package com.bharath.cabbooking.controller;

import com.bharath.cabbooking.domain.CabType;
import com.bharath.cabbooking.dto.ApiDtos.*;
import com.bharath.cabbooking.service.CabService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/cabs")
public class CabController {
    private final CabService cabs;

    public CabController(CabService cabs) {
        this.cabs = cabs;
    }

    @GetMapping
    public List<CabResponse> list() { return cabs.list(false); }

    @GetMapping("/available")
    public List<CabResponse> available(@RequestParam(required = false) CabType type) {
        if (type == null) return cabs.list(true);
        return cabs.list(true).stream().filter(cab -> cab.cabType() == type).toList();
    }

    @GetMapping("/{id}")
    public CabResponse get(@PathVariable Long id) { return cabs.get(id); }

    @PostMapping
    public CabResponse create(@Valid @RequestBody CabRequest request) { return cabs.create(request); }

    @PutMapping("/{id}")
    public CabResponse update(@PathVariable Long id, @Valid @RequestBody CabRequest request) {
        return cabs.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { cabs.delete(id); }
}
