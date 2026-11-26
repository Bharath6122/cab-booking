package com.bharath.cabbooking.security;

import com.bharath.cabbooking.entity.UserAccount;
import com.bharath.cabbooking.repository.UserRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository users;

    public CustomUserDetailsService(UserRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserAccount account = users.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("Account not found"));
        return User.withUsername(account.getEmail())
                .password(account.getPassword())
                .authorities(account.getRole().name())
                .build();
    }
}
