package com.smartcampus.operationshub.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class OAuth2StartupValidator {

    private final boolean oauth2Enabled;
    private final String googleClientId;
    private final String googleClientSecret;

    public OAuth2StartupValidator(
            @Value("${app.security.oauth2.enabled:false}") boolean oauth2Enabled,
            @Value("${spring.security.oauth2.client.registration.google.client-id:}") String googleClientId,
            @Value("${spring.security.oauth2.client.registration.google.client-secret:}") String googleClientSecret
    ) {
        this.oauth2Enabled = oauth2Enabled;
        this.googleClientId = googleClientId;
        this.googleClientSecret = googleClientSecret;
    }

    @SuppressWarnings("unused")
    @PostConstruct
    void validate() {
        if (!oauth2Enabled) {
            return;
        }

        if (isBlank(googleClientId) || isBlank(googleClientSecret)) {
            throw new IllegalStateException(
                    "OAuth2 is enabled, but Google client credentials are missing. "
                            + "Set SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID and "
                            + "SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET."
            );
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}