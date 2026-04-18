package com.smartcampus.operationshub.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.operationshub.dto.ResourceRequest;
import com.smartcampus.operationshub.entity.ResourceStatus;
import com.smartcampus.operationshub.entity.ResourceType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class ResourceControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createAndFilterResources_shouldReturnCreatedData() throws Exception {
        ResourceRequest request = new ResourceRequest();
        request.setName("Lab C-03");
        request.setType(ResourceType.LAB);
        request.setCapacity(35);
        request.setLocation("Building C - Floor 1");
        request.setStatus(ResourceStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/resources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Lab C-03"));

        mockMvc.perform(get("/api/v1/resources")
                        .param("type", "LAB")
                        .param("location", "Building C"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("LAB"));
    }

    @Test
    void createResource_shouldReturnBadRequestForInvalidPayload() throws Exception {
        ResourceRequest request = new ResourceRequest();
        request.setName(" ");
        request.setType(ResourceType.MEETING_ROOM);
        request.setCapacity(0);
        request.setLocation(" ");
        request.setStatus(ResourceStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/resources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.name").exists())
                .andExpect(jsonPath("$.validationErrors.capacity").exists());
    }

    @Test
    void resourceCrudLifecycle_shouldSupportGetUpdateDeleteById() throws Exception {
        ResourceRequest createRequest = new ResourceRequest();
        createRequest.setName("Meeting Room D-17");
        createRequest.setType(ResourceType.MEETING_ROOM);
        createRequest.setCapacity(18);
        createRequest.setLocation("Building D - Floor 1");
        createRequest.setStatus(ResourceStatus.ACTIVE);

        String createResponse = mockMvc.perform(post("/api/v1/resources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode createdNode = objectMapper.readTree(createResponse);
        long resourceId = createdNode.get("id").asLong();

        mockMvc.perform(get("/api/v1/resources/{id}", resourceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(resourceId))
                .andExpect(jsonPath("$.name").value("Meeting Room D-17"));

        ResourceRequest updateRequest = new ResourceRequest();
        updateRequest.setName("Meeting Room D-17 - Updated");
        updateRequest.setType(ResourceType.MEETING_ROOM);
        updateRequest.setCapacity(24);
        updateRequest.setLocation("Building D - Floor 2");
        updateRequest.setStatus(ResourceStatus.OUT_OF_SERVICE);

        mockMvc.perform(put("/api/v1/resources/{id}", resourceId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(resourceId))
                .andExpect(jsonPath("$.name").value("Meeting Room D-17 - Updated"))
                .andExpect(jsonPath("$.capacity").value(24))
                .andExpect(jsonPath("$.status").value("OUT_OF_SERVICE"));

        mockMvc.perform(delete("/api/v1/resources/{id}", resourceId))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/resources/{id}", resourceId))
                .andExpect(status().isNotFound());
    }

    @Test
    void getResources_shouldReturnBadRequestWhenCapacityRangeInvalid() throws Exception {
        mockMvc.perform(get("/api/v1/resources")
                        .param("minCapacity", "120")
                        .param("maxCapacity", "20"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Minimum capacity cannot be greater than maximum capacity"));
    }
}