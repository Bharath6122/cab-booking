package com.bharath.cabbooking.entity;

import com.bharath.cabbooking.domain.DriverStatus;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "drivers", uniqueConstraints = @UniqueConstraint(columnNames = "license_number"))
public class Driver {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(name = "license_number", nullable = false, unique = true, length = 60)
    private String licenseNumber;

    @Column(nullable = false)
    private int experienceYears;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DriverStatus status = DriverStatus.AVAILABLE;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Driver() {}

    public Driver(String fullName, String phone, String licenseNumber, int experienceYears, DriverStatus status) {
        this.fullName = fullName;
        this.phone = phone;
        this.licenseNumber = licenseNumber;
        this.experienceYears = experienceYears;
        this.status = status;
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getPhone() { return phone; }
    public String getLicenseNumber() { return licenseNumber; }
    public int getExperienceYears() { return experienceYears; }
    public DriverStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public void update(String fullName, String phone, String licenseNumber, int experienceYears, DriverStatus status) {
        this.fullName = fullName;
        this.phone = phone;
        this.licenseNumber = licenseNumber;
        this.experienceYears = experienceYears;
        this.status = status;
    }
    public void setStatus(DriverStatus status) { this.status = status; }
}
