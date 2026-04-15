package com.smartcampus.operationshub.dto;

public class AuthRoleResponse {

    private String role;

    public AuthRoleResponse() {
    }

    public AuthRoleResponse(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
