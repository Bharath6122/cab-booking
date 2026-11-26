package com.bharath.cabbooking.service;

import com.bharath.cabbooking.domain.Role;
import com.bharath.cabbooking.dto.ApiDtos.ProfileRequest;
import com.bharath.cabbooking.dto.ApiDtos.UserResponse;
import com.bharath.cabbooking.entity.UserAccount;
import com.bharath.cabbooking.repository.BookingRepository;
import com.bharath.cabbooking.repository.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {
    private final UserRepository users;
    private final BookingRepository bookings;

    public UserService(UserRepository users, BookingRepository bookings) {
        this.users = users;
        this.bookings = bookings;
    }

    public Page<UserResponse> list(Pageable pageable) {
        return users.findAll(pageable).map(ApiMapper::user);
    }

    public UserResponse get(Long id) {
        return ApiMapper.user(findUser(id));
    }

    @Transactional
    public UserResponse update(Long id, ProfileRequest request) {
        UserAccount user = findUser(id);
        user.updateProfile(request.fullName().trim(), request.phone().trim());
        return ApiMapper.user(user);
    }

    @Transactional
    public void delete(Long id, Authentication authentication) {
        UserAccount user = findUser(id);
        if (user.getEmail().equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You cannot delete your own account");
        }
        if (user.getRole() == Role.ROLE_ADMIN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Administrator accounts cannot be deleted here");
        }
        if (bookings.existsByUserId(user.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Users with booking history cannot be deleted");
        }
        users.delete(user);
    }

    private UserAccount findUser(Long id) {
        return users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
