package com.smartcampus.operationshub.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.operationshub.dto.ResourceRequest;
import com.smartcampus.operationshub.entity.ResourceStatus;
import com.smartcampus.operationshub.entity.ResourceType;
import jakarta.transaction.Transactional;
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
@Transactional
class ResourceControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createAndFilterResources_shouldReturnCreatedData() throws Exception {
        long resourceId = createResource("Lab C-03", ResourceType.LAB, 35, "Building C - Floor 1");

        mockMvc.perform(get("/api/v1/resources/{id}", resourceId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Lab C-03"));

        mockMvc.perform(get("/api/v1/resources")
                        .param("type", "LAB")
                        .param("location", "Building C"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("LAB"));
    }

        @Test
        void updateResource_shouldReturnUpdatedPayload() throws Exception {
        long resourceId = createResource("Meeting M-04", ResourceType.MEETING_ROOM, 20, "Building M");

        ResourceRequest update = new ResourceRequest();
        update.setName("Meeting M-04 Updated");
        update.setType(ResourceType.MEETING_ROOM);
        update.setCapacity(24);
        update.setLocation("Building M - Floor 2");
        update.setStatus(ResourceStatus.OUT_OF_SERVICE);
        update.setAvailabilityDays("Weekends");

        mockMvc.perform(put("/api/v1/resources/{id}", resourceId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Meeting M-04 Updated"))
            .andExpect(jsonPath("$.capacity").value(24))
            .andExpect(jsonPath("$.status").value("OUT_OF_SERVICE"));
        }

        @Test
        void deleteResource_shouldReturnNotFoundAfterDelete() throws Exception {
        long resourceId = createResource("Projector X-1", ResourceType.PROJECTOR, 1, "Media Store");

        mockMvc.perform(delete("/api/v1/resources/{id}", resourceId))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/resources/{id}", resourceId))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").exists());
        }

        @Test
        void getResources_shouldReturnBadRequestForInvalidCapacityRange() throws Exception {
        mockMvc.perform(get("/api/v1/resources")
                .param("minCapacity", "50")
                .param("maxCapacity", "10"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Minimum capacity cannot be greater than maximum capacity"));
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

    private long createResource(String name, ResourceType type, int capacity, String location) throws Exception {
        ResourceRequest request = new ResourceRequest();
        request.setName(name);
        request.setType(type);
        request.setCapacity(capacity);
        request.setLocation(location);
        request.setStatus(ResourceStatus.ACTIVE);

        String createdJson = mockMvc.perform(post("/api/v1/resources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(createdJson).get("id").asLong();
    }
}