package com.bharath.cabbooking.entity;

import com.bharath.cabbooking.domain.CabStatus;
import com.bharath.cabbooking.domain.CabType;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "cabs", uniqueConstraints = @UniqueConstraint(columnNames = "registration_number"))
public class Cab {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String cabName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CabType cabType;

    @Column(name = "registration_number", nullable = false, unique = true, length = 30)
    private String registrationNumber;

    @Column(nullable = false)
    private int seatingCapacity;

    @Column(nullable = false)
    private double pricePerKm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CabStatus status = CabStatus.AVAILABLE;

    @OneToOne
    @JoinColumn(name = "assigned_driver_id", unique = true)
    private Driver assignedDriver;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Cab() {}

    public Cab(String cabName, CabType cabType, String registrationNumber, int seatingCapacity,
               double pricePerKm, CabStatus status, Driver assignedDriver) {
        this.cabName = cabName;
        this.cabType = cabType;
        this.registrationNumber = registrationNumber;
        this.seatingCapacity = seatingCapacity;
        this.pricePerKm = pricePerKm;
        this.status = status;
        this.assignedDriver = assignedDriver;
    }

    public Long getId() { return id; }
    public String getCabName() { return cabName; }
    public CabType getCabType() { return cabType; }
    public String getRegistrationNumber() { return registrationNumber; }
    public int getSeatingCapacity() { return seatingCapacity; }
    public double getPricePerKm() { return pricePerKm; }
    public CabStatus getStatus() { return status; }
    public Driver getAssignedDriver() { return assignedDriver; }
    public Instant getCreatedAt() { return createdAt; }
    public void update(String cabName, CabType cabType, String registrationNumber, int seatingCapacity,
                       double pricePerKm, CabStatus status, Driver assignedDriver) {
        this.cabName = cabName;
        this.cabType = cabType;
        this.registrationNumber = registrationNumber;
        this.seatingCapacity = seatingCapacity;
        this.pricePerKm = pricePerKm;
        this.status = status;
        this.assignedDriver = assignedDriver;
    }
    public void setStatus(CabStatus status) { this.status = status; }
}
