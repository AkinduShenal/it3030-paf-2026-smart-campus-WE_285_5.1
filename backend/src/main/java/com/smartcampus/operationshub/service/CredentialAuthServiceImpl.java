package com.smartcampus.operationshub.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartcampus.operationshub.dto.AuthLoginRequest;
import com.smartcampus.operationshub.dto.AuthSessionResponse;
import com.smartcampus.operationshub.dto.AuthSignupRequest;
import com.smartcampus.operationshub.entity.AppUser;
import com.smartcampus.operationshub.entity.AppUserRole;
import com.smartcampus.operationshub.exception.InvalidCredentialsException;
import com.smartcampus.operationshub.exception.UserAlreadyExistsException;
import com.smartcampus.operationshub.repository.AppUserRepository;

@Service
@Transactional
public class CredentialAuthServiceImpl implements CredentialAuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public CredentialAuthServiceImpl(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public AuthSessionResponse signup(AuthSignupRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (appUserRepository.existsByEmail(email)) {
            throw new UserAlreadyExistsException("An account already exists for this email.");
        }

        AppUserRole role = parseRequestedRole(request.getRole());

        AppUser appUser = new AppUser();
        appUser.setEmail(email);
        appUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        appUser.setRole(role);

        AppUser saved = appUserRepository.save(appUser);
        return toSessionResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthSessionResponse login(AuthLoginRequest request) {
        String email = normalizeEmail(request.getEmail());

        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password.");
        }

        String requestedRole = normalizeRole(request.getRole());
        Set<String> resolvedRoles = resolveRoleHierarchy(user.getRole());
        if (requestedRole != null && !resolvedRoles.contains(requestedRole)) {
            throw new InvalidCredentialsException("Selected role is not allowed for this account.");
        }

        return toSessionResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> findPrimaryRoleByEmail(String email) {
        return appUserRepository.findByEmail(normalizeEmail(email))
                .map(user -> user.getRole().name());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AppUser> findByEmail(String email) {
        return appUserRepository.findByEmail(normalizeEmail(email));
    }

    @Override
    public Set<String> resolveRoleHierarchy(AppUserRole role) {
        Set<String> roles = new LinkedHashSet<>();
        roles.add("USER");
        if (role == AppUserRole.TECHNICIAN) {
            roles.add("TECHNICIAN");
        }
        if (role == AppUserRole.ADMIN) {
            roles.add("ADMIN");
        }
        return roles;
    }

    private AuthSessionResponse toSessionResponse(AppUser user) {
        AuthSessionResponse response = new AuthSessionResponse();
        response.setEmail(user.getEmail());
        response.setDisplayName(buildDisplayName(user.getEmail()));
        response.setRoles(new ArrayList<>(resolveRoleHierarchy(user.getRole())));
        response.setAuthenticated(true);
        return response;
    }

    private AppUserRole parseRequestedRole(String role) {
        String normalized = normalizeRole(role);
        if (normalized == null) {
            return AppUserRole.USER;
        }
        try {
            return AppUserRole.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unsupported role. Use USER, TECHNICIAN, or ADMIN.");
        }
    }

    private String normalizeEmail(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }
        return input.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }
        return role.trim().toUpperCase(Locale.ROOT);
    }

    private String buildDisplayName(String email) {
        String localPart = email.split("@")[0];
        String[] words = localPart.replace('.', ' ').replace('_', ' ').split("\\s+");
        ArrayList<String> transformed = new ArrayList<>();
        for (String word : words) {
            if (word.isBlank()) {
                continue;
            }
            transformed.add(word.substring(0, 1).toUpperCase(Locale.ROOT) + word.substring(1));
        }
        return transformed.isEmpty() ? "Campus User" : String.join(" ", transformed);
    }
}
