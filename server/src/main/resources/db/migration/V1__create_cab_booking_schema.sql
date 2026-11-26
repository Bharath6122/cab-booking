CREATE TABLE app_users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(190) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_app_users_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE drivers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    license_number VARCHAR(60) NOT NULL,
    experience_years INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_drivers_license_number UNIQUE (license_number)
) ENGINE=InnoDB;

CREATE TABLE cabs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    cab_name VARCHAR(80) NOT NULL,
    cab_type VARCHAR(20) NOT NULL,
    registration_number VARCHAR(30) NOT NULL,
    seating_capacity INTEGER NOT NULL,
    price_per_km DOUBLE NOT NULL,
    status VARCHAR(20) NOT NULL,
    assigned_driver_id BIGINT,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_cabs_registration_number UNIQUE (registration_number),
    CONSTRAINT uk_cabs_assigned_driver UNIQUE (assigned_driver_id),
    CONSTRAINT fk_cabs_assigned_driver FOREIGN KEY (assigned_driver_id) REFERENCES drivers (id)
) ENGINE=InnoDB;

CREATE TABLE bookings (
    id BIGINT NOT NULL AUTO_INCREMENT,
    booking_reference VARCHAR(40) NOT NULL,
    user_id BIGINT NOT NULL,
    driver_id BIGINT NOT NULL,
    cab_id BIGINT NOT NULL,
    pickup_location VARCHAR(180) NOT NULL,
    drop_location VARCHAR(180) NOT NULL,
    distance_km DOUBLE NOT NULL,
    estimated_fare DOUBLE NOT NULL,
    booking_date_time DATETIME(6) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_bookings_booking_reference UNIQUE (booking_reference),
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES app_users (id),
    CONSTRAINT fk_bookings_driver FOREIGN KEY (driver_id) REFERENCES drivers (id),
    CONSTRAINT fk_bookings_cab FOREIGN KEY (cab_id) REFERENCES cabs (id),
    INDEX idx_bookings_user_created (user_id, created_at),
    INDEX idx_bookings_status (status)
) ENGINE=InnoDB;
