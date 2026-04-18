package com.smartcampus.operationshub.security;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;

import com.smartcampus.operationshub.entity.AppUser;
import com.smartcampus.operationshub.service.CredentialAuthService;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final String OAUTH2_FLOW_SESSION_KEY = "oauth2_flow";
    private static final String OAUTH2_FLOW_SIGNUP = "signup";

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
        @Value("${app.security.oauth2.enabled:false}") boolean oauth2Enabled,
        @Value("${app.security.oauth2.frontend-success-url:http://localhost:5173/}") String frontendSuccessUrl,
        OAuth2UserService<OAuth2UserRequest, OAuth2User> oauth2UserService,
        CredentialAuthService credentialAuthService,
        OAuth2RoleService oauth2RoleService
    ) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .authorizeHttpRequests(auth -> {
            auth.requestMatchers(
                "/api/v1/health",
                "/api/v1/public/**",
                "/api/v1/auth/me",
                "/api/v1/auth/login",
                "/api/v1/auth/signup",
                "/api/v1/auth/role",
                "/api/v1/auth/oauth2/**",
                "/h2-console/**",
                "/oauth2/**",
                "/login/**"
            ).permitAll();
                    if (oauth2Enabled) {
            auth.requestMatchers(HttpMethod.POST, "/api/v1/resources/**").hasRole("ADMIN");
            auth.requestMatchers(HttpMethod.PUT, "/api/v1/resources/**").hasRole("ADMIN");
            auth.requestMatchers(HttpMethod.DELETE, "/api/v1/resources/**").hasRole("ADMIN");
                        auth.requestMatchers(
                                "/api/v1/bookings/*/approve",
                                "/api/v1/bookings/*/reject"
                        ).hasRole("ADMIN");
                        auth.requestMatchers(
                                "/api/v1/tickets/*/assign",
                                "/api/v1/tickets/*/status",
                                "/api/v1/tickets/*/reject"
                        ).hasAnyRole("ADMIN", "TECHNICIAN");
                        auth.anyRequest().authenticated();
                    } else {
                        auth.anyRequest().permitAll();
                    }
                });

        if (oauth2Enabled) {
            http.oauth2Login(oauth2 -> oauth2
                    .userInfoEndpoint(userInfo -> userInfo.userService(oauth2UserService))
                    .successHandler(frontendRedirectSuccessHandler(frontendSuccessUrl, credentialAuthService, oauth2RoleService))
            );
            http.logout(logout -> logout.logoutSuccessUrl(normalizeFrontendPath(frontendSuccessUrl, "/login")));
        }

        return http.build();
    }

    @Bean
    public OAuth2UserService<OAuth2UserRequest, OAuth2User> oauth2UserService(
            OAuth2RoleService oauth2RoleService,
            CredentialAuthService credentialAuthService
    ) {
        DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();

        return userRequest -> {
            OAuth2User oauth2User = delegate.loadUser(userRequest);
            String email = oauth2RoleService.extractEmail(oauth2User);

            Set<org.springframework.security.core.GrantedAuthority> authorities = new LinkedHashSet<>(oauth2User.getAuthorities());

            Optional<AppUser> localUser = credentialAuthService.findByEmail(email);
            if (localUser.isPresent()) {
                for (String role : credentialAuthService.resolveRoleHierarchy(localUser.get().getRole())) {
                    authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role));
                }
            } else {
                authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER"));
            }

            String configuredNameAttribute = userRequest.getClientRegistration()
                    .getProviderDetails()
                    .getUserInfoEndpoint()
                    .getUserNameAttributeName();
            String nameAttribute = chooseNameAttribute(configuredNameAttribute, oauth2User);

            return new DefaultOAuth2User(authorities, oauth2User.getAttributes(), nameAttribute);
        };
    }

    private AuthenticationSuccessHandler frontendRedirectSuccessHandler(
            String redirectUrl,
            CredentialAuthService credentialAuthService,
            OAuth2RoleService oauth2RoleService
    ) {
        return (request, response, authentication) -> {
            String flow = resolveAndClearFlow(request.getSession(false));
            String email = resolveEmail(authentication, oauth2RoleService);
            String encodedEmail = URLEncoder.encode(email, StandardCharsets.UTF_8);
            String loginPath = normalizeFrontendPath(redirectUrl, "/login");
            String signupPath = normalizeFrontendPath(redirectUrl, "/signup");

            if (OAUTH2_FLOW_SIGNUP.equals(flow)) {
                clearAuthentication(request, response, authentication);
                sendRedirect(response, signupPath + "?email=" + encodedEmail);
                return;
            }

            if (credentialAuthService.findByEmail(email).isEmpty()) {
                clearAuthentication(request, response, authentication);
                sendRedirect(response, loginPath + "?error=not_registered&email=" + encodedEmail);
                return;
            }

            sendRedirect(response, redirectUrl);
        };
    }

    private void sendRedirect(jakarta.servlet.http.HttpServletResponse response, String redirectUrl) throws IOException {
        String sanitized = redirectUrl == null || redirectUrl.isBlank() ? "http://localhost:5173/" : redirectUrl.trim();
        response.sendRedirect(sanitized);
    }

    private String chooseNameAttribute(String configuredNameAttribute, OAuth2User oauth2User) {
        if (configuredNameAttribute != null
                && !configuredNameAttribute.isBlank()
                && oauth2User.getAttributes().containsKey(configuredNameAttribute)) {
            return configuredNameAttribute;
        }
        if (oauth2User.getAttributes().containsKey("email")) {
            return "email";
        }
        if (oauth2User.getAttributes().containsKey("sub")) {
            return "sub";
        }
        return oauth2User.getAttributes().keySet().stream().findFirst().orElse("sub");
    }

    private String resolveEmail(org.springframework.security.core.Authentication authentication, OAuth2RoleService oauth2RoleService) {
        if (authentication != null && authentication.getPrincipal() instanceof OAuth2User oauth2User) {
            String extracted = oauth2RoleService.extractEmail(oauth2User);
            if (!extracted.isBlank()) {
                return extracted;
            }
        }
        if (authentication == null || authentication.getName() == null) {
            return "";
        }
        return authentication.getName().trim().toLowerCase(Locale.ROOT);
    }

    private String resolveAndClearFlow(jakarta.servlet.http.HttpSession session) {
        if (session == null) {
            return "";
        }
        Object value = session.getAttribute(OAUTH2_FLOW_SESSION_KEY);
        session.removeAttribute(OAUTH2_FLOW_SESSION_KEY);
        return value == null ? "" : String.valueOf(value).trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeFrontendPath(String baseUrl, String targetPath) {
        String sanitized = baseUrl == null || baseUrl.isBlank() ? "http://localhost:5173" : baseUrl.trim();
        if (sanitized.endsWith("/")) {
            sanitized = sanitized.substring(0, sanitized.length() - 1);
        }
        return sanitized + targetPath;
    }

    private void clearAuthentication(
            jakarta.servlet.http.HttpServletRequest request,
            jakarta.servlet.http.HttpServletResponse response,
            org.springframework.security.core.Authentication authentication
    ) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
