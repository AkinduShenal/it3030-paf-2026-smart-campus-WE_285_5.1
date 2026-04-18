package com.smartcampus.operationshub.controller;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.operationshub.dto.AuthLoginRequest;
import com.smartcampus.operationshub.dto.AuthRoleResponse;
import com.smartcampus.operationshub.dto.AuthSessionResponse;
import com.smartcampus.operationshub.dto.AuthSignupRequest;
import com.smartcampus.operationshub.dto.UserProfileResponse;
import com.smartcampus.operationshub.entity.AppUser;
import com.smartcampus.operationshub.security.OAuth2RoleService;
import com.smartcampus.operationshub.service.CredentialAuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String DEFAULT_EMAIL = "student1@smartcampus.local";
    private static final String GUEST_EMAIL = "guest@smartcampus.local";
    private static final String OAUTH2_FLOW_SESSION_KEY = "oauth2_flow";

    private final boolean oauth2Enabled;
    private final String oauth2RegistrationId;
    private final String backendBaseUrl;
    private final OAuth2RoleService oauth2RoleService;
    private final CredentialAuthService credentialAuthService;

    public AuthController(
            @Value("${app.security.oauth2.enabled:false}") boolean oauth2Enabled,
            @Value("${app.security.oauth2.registration-id:google}") String oauth2RegistrationId,
            @Value("${app.security.oauth2.backend-base-url:http://localhost:8080}") String backendBaseUrl,
            OAuth2RoleService oauth2RoleService,
            CredentialAuthService credentialAuthService
    ) {
        this.oauth2Enabled = oauth2Enabled;
        this.oauth2RegistrationId = oauth2RegistrationId;
        this.backendBaseUrl = backendBaseUrl;
        this.oauth2RoleService = oauth2RoleService;
        this.credentialAuthService = credentialAuthService;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthSessionResponse> signup(
            @Valid @RequestBody AuthSignupRequest request,
            jakarta.servlet.http.HttpServletRequest servletRequest,
            jakarta.servlet.http.HttpServletResponse servletResponse
    ) {
        AuthSessionResponse session = credentialAuthService.signup(request);
        establishLocalAuthentication(session, servletRequest, servletResponse);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthSessionResponse> login(
            @Valid @RequestBody AuthLoginRequest request,
            jakarta.servlet.http.HttpServletRequest servletRequest,
            jakarta.servlet.http.HttpServletResponse servletResponse
    ) {
        AuthSessionResponse session = credentialAuthService.login(request);
        establishLocalAuthentication(session, servletRequest, servletResponse);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/role")
    public ResponseEntity<AuthRoleResponse> resolveRole(@RequestParam("email") String email) {
        String normalizedEmail = normalizeEmail(email, "");
        if (normalizedEmail.isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }

        String role = credentialAuthService.findPrimaryRoleByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("No registered user found for this email."));

        return ResponseEntity.ok(new AuthRoleResponse(role));
    }

    @GetMapping("/oauth2/{provider}/{flow}")
    public void beginOAuthFlow(
            @org.springframework.web.bind.annotation.PathVariable("provider") String provider,
            @org.springframework.web.bind.annotation.PathVariable("flow") String flow,
            jakarta.servlet.http.HttpServletRequest request,
            jakarta.servlet.http.HttpServletResponse response
    ) throws java.io.IOException {
        String normalizedProvider = provider == null ? "" : provider.trim().toLowerCase(Locale.ROOT);
        String normalizedFlow = flow == null ? "" : flow.trim().toLowerCase(Locale.ROOT);

        if (normalizedProvider.isBlank()) {
            throw new IllegalArgumentException("OAuth2 provider is required.");
        }
        if (!"login".equals(normalizedFlow) && !"signup".equals(normalizedFlow)) {
            throw new IllegalArgumentException("Unsupported OAuth2 flow. Use login or signup.");
        }

        request.getSession(true).setAttribute(OAUTH2_FLOW_SESSION_KEY, normalizedFlow);
        response.sendRedirect("/oauth2/authorization/" + normalizedProvider + "?prompt=select_account");
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail,
            @RequestHeader(value = "X-User-Roles", required = false) String headerRoles
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAuthenticated = authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);

        boolean localAuthAllowed = !oauth2Enabled;

        String email;
        if (isAuthenticated) {
            email = resolveAuthenticatedEmail(authentication);
        } else if (localAuthAllowed && headerEmail != null && !headerEmail.isBlank()) {
            email = normalizeEmail(headerEmail, GUEST_EMAIL);
        } else {
            email = GUEST_EMAIL;
        }

        Optional<AppUser> localUser = credentialAuthService.findByEmail(email);

        Set<String> roleSet = new LinkedHashSet<>();
        if (isAuthenticated && authentication != null && authentication.getAuthorities() != null) {
            for (GrantedAuthority authority : authentication.getAuthorities()) {
                String authorityName = authority.getAuthority();
                if (authorityName == null || authorityName.isBlank()) {
                    continue;
                }
                if (authorityName.startsWith("ROLE_")) {
                    roleSet.add(authorityName.substring(5));
                }
            }
            if (roleSet.isEmpty() && localUser.isPresent()) {
                roleSet.addAll(credentialAuthService.resolveRoleHierarchy(localUser.get().getRole()));
            }
        } else if (localAuthAllowed && localUser.isPresent()) {
            roleSet.addAll(credentialAuthService.resolveRoleHierarchy(localUser.get().getRole()));
        } else if (localAuthAllowed && headerRoles != null && !headerRoles.isBlank()) {
            for (String token : headerRoles.split(",")) {
                if (!token.isBlank()) {
                    roleSet.add(token.trim().toUpperCase(Locale.ROOT));
                }
            }
        }

        if (roleSet.isEmpty() && (isAuthenticated || (localAuthAllowed && !GUEST_EMAIL.equals(email)))) {
            roleSet.add("USER");
        }

        boolean locallyAuthenticated = localAuthAllowed && (localUser.isPresent() || (headerEmail != null && !headerEmail.isBlank()));
        boolean effectiveAuthenticated = oauth2Enabled ? isAuthenticated : (isAuthenticated || locallyAuthenticated);

        UserProfileResponse profile = new UserProfileResponse();
        profile.setEmail(email);
        profile.setDisplayName(buildDisplayName(email));
        profile.setRoles(new ArrayList<>(roleSet));
        profile.setAuthenticated(effectiveAuthenticated);
        profile.setOauth2Enabled(oauth2Enabled);
        profile.setLoginUrl(buildLoginUrl());
        profile.setLogoutUrl(buildLogoutUrl());
        return ResponseEntity.ok(profile);
    }

    private String resolveAuthenticatedEmail(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof OAuth2User oauth2User) {
            return normalizeEmail(oauth2RoleService.extractEmail(oauth2User), DEFAULT_EMAIL);
        }
        return normalizeEmail(authentication.getName(), DEFAULT_EMAIL);
    }

    private String buildLoginUrl() {
        return sanitizeBaseUrl(backendBaseUrl) + "/oauth2/authorization/" + oauth2RegistrationId;
    }

    private String buildLogoutUrl() {
        return sanitizeBaseUrl(backendBaseUrl) + "/logout";
    }

    private String sanitizeBaseUrl(String value) {
        if (value == null || value.isBlank()) {
            return "http://localhost:8080";
        }
        String trimmed = value.trim();
        if (trimmed.endsWith("/")) {
            return trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private String normalizeEmail(String input, String fallback) {
        if (input == null || input.isBlank()) {
            return fallback;
        }
        return input.trim().toLowerCase(Locale.ROOT);
    }

    private String buildDisplayName(String email) {
        String localPart = email.split("@")[0];
        String[] words = localPart.replace('.', ' ').replace('_', ' ').split("\\s+");
        List<String> transformed = new ArrayList<>();
        for (String word : words) {
            if (word.isBlank()) {
                continue;
            }
            transformed.add(word.substring(0, 1).toUpperCase(Locale.ROOT) + word.substring(1));
        }
        return transformed.isEmpty() ? "Campus User" : String.join(" ", transformed);
    }

    private void establishLocalAuthentication(
            AuthSessionResponse session,
            jakarta.servlet.http.HttpServletRequest request,
            jakarta.servlet.http.HttpServletResponse response
    ) {
        if (session == null || session.getEmail() == null || session.getEmail().isBlank()) {
            return;
        }

        List<SimpleGrantedAuthority> authorities = session.getRoles() == null
                ? List.of()
                : session.getRoles().stream()
                .filter(role -> role != null && !role.isBlank())
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.trim().toUpperCase(Locale.ROOT)))
                .toList();

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(session.getEmail(), null, authorities);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        new HttpSessionSecurityContextRepository().saveContext(context, request, response);
    }
}