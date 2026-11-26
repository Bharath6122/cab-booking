package com.bharath.cabbooking.service;

import com.bharath.cabbooking.domain.Role;
import com.bharath.cabbooking.dto.ApiDtos.*;
import com.bharath.cabbooking.entity.UserAccount;
import com.bharath.cabbooking.repository.UserRepository;
import com.bharath.cabbooking.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        UserAccount account = users.save(new UserAccount(request.fullName().trim(), email,
                passwordEncoder.encode(request.password()), request.phone().trim(), Role.ROLE_USER));
        return new AuthResponse(jwtService.generate(email), ApiMapper.user(account));
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        } catch (AuthenticationException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        UserAccount account = users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        return new AuthResponse(jwtService.generate(email), ApiMapper.user(account));
    }

    public UserResponse currentUser(String email) {
        return ApiMapper.user(findUser(email));
    }

    @Transactional
    public UserResponse updateProfile(String email, ProfileRequest request) {
        UserAccount account = findUser(email);
        account.updateProfile(request.fullName().trim(), request.phone().trim());
        return ApiMapper.user(account);
    }

    private UserAccount findUser(String email) {
        return users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
