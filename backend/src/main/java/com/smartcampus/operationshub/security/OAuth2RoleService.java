package com.smartcampus.operationshub.security;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

@Component
public class OAuth2RoleService {

    private final Set<String> adminEmails;
    private final Set<String> technicianEmails;

    public OAuth2RoleService(
            @Value("${app.security.rbac.admin-emails:}") String adminEmails,
            @Value("${app.security.rbac.technician-emails:}") String technicianEmails
    ) {
        this.adminEmails = parseCsvEmails(adminEmails);
        this.technicianEmails = parseCsvEmails(technicianEmails);
    }

    public Set<GrantedAuthority> resolveAuthoritiesByEmail(String email) {
        String normalizedEmail = normalizeEmail(email);
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

        if (adminEmails.contains(normalizedEmail)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        if (technicianEmails.contains(normalizedEmail)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_TECHNICIAN"));
        }

        return authorities;
    }

    public String extractEmail(OAuth2User oauth2User) {
        if (oauth2User == null) {
            return "";
        }
        Object emailAttribute = oauth2User.getAttributes().get("email");
        if (emailAttribute instanceof String email && !email.isBlank()) {
            return normalizeEmail(email);
        }
        return normalizeEmail(oauth2User.getName());
    }

    private Set<String> parseCsvEmails(String csv) {
        Set<String> parsed = new LinkedHashSet<>();
        if (csv == null || csv.isBlank()) {
            return parsed;
        }
        String[] tokens = csv.split(",");
        for (String token : tokens) {
            if (token == null || token.isBlank()) {
                continue;
            }
            parsed.add(normalizeEmail(token));
        }
        return parsed;
    }

    private String normalizeEmail(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
