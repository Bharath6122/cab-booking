package com.bharath.cabbooking.config;

import com.bharath.cabbooking.domain.*;
import com.bharath.cabbooking.entity.*;
import com.bharath.cabbooking.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.List;

@Configuration
public class StartupData {
    @Bean
    CommandLineRunner initializeData(UserRepository users, DriverRepository drivers, CabRepository cabs,
                                     PasswordEncoder passwordEncoder,
                                     @Value("${app.admin.email:}") String adminEmail,
                                     @Value("${app.admin.password:}") String adminPassword) {
        return args -> {
            createAdmin(users, passwordEncoder, adminEmail, adminPassword);
            seedFleet(drivers, cabs);
        };
    }

    void createAdmin(UserRepository users, PasswordEncoder passwordEncoder, String email, String password) {
        if (email.isBlank() && password.isBlank()) return;
        if (email.isBlank() || password.isBlank()) {
            throw new IllegalStateException("Set both ADMIN_EMAIL and ADMIN_PASSWORD to provision the administrator account");
        }
        if (password.length() < 12) {
            throw new IllegalStateException("ADMIN_PASSWORD must be at least 12 characters");
        }
        String normalizedEmail = email.trim().toLowerCase();
        var existing = users.findByEmail(normalizedEmail);
        if (existing.isPresent()) {
            if (existing.get().getRole() != Role.ROLE_ADMIN) {
                throw new IllegalStateException("ADMIN_EMAIL already belongs to a non-administrator account");
            }
            return;
        }
        users.save(new UserAccount("Cabby Administrator", normalizedEmail,
                passwordEncoder.encode(password), "+10000000000", Role.ROLE_ADMIN));
    }

    void seedFleet(DriverRepository drivers, CabRepository cabs) {
        if (drivers.count() > 0 || cabs.count() > 0) return;
        List<Driver> sampleDrivers = drivers.saveAll(List.of(
                new Driver("Aarav Kumar", "+91 90000 10001", "CAB-DEMO-001", 7, DriverStatus.AVAILABLE),
                new Driver("Maya Raj", "+91 90000 10002", "CAB-DEMO-002", 5, DriverStatus.AVAILABLE),
                new Driver("Ishaan Das", "+91 90000 10003", "CAB-DEMO-003", 9, DriverStatus.AVAILABLE),
                new Driver("Nila Joseph", "+91 90000 10004", "CAB-DEMO-004", 4, DriverStatus.AVAILABLE)));
        cabs.saveAll(List.of(
                new Cab("The Little Green", CabType.MINI, "CB-01-AB-1001", 3, 12, CabStatus.AVAILABLE, sampleDrivers.get(0)),
                new Cab("Easy Sunday", CabType.SEDAN, "CB-01-CD-2002", 4, 17, CabStatus.AVAILABLE, sampleDrivers.get(1)),
                new Cab("Room to Roam", CabType.SUV, "CB-01-EF-3003", 6, 22, CabStatus.AVAILABLE, sampleDrivers.get(2)),
                new Cab("The Good Life", CabType.PREMIUM, "CB-01-GH-4004", 4, 30, CabStatus.AVAILABLE, sampleDrivers.get(3))));
    }
}
