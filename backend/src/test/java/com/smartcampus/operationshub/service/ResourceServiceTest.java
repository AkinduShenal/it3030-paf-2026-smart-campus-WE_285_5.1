package com.smartcampus.operationshub.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartcampus.operationshub.dto.ResourceRequest;
import com.smartcampus.operationshub.dto.ResourceResponse;
import com.smartcampus.operationshub.entity.Resource;
import com.smartcampus.operationshub.entity.ResourceStatus;
import com.smartcampus.operationshub.entity.ResourceType;
import com.smartcampus.operationshub.exception.ResourceNotFoundException;
import com.smartcampus.operationshub.repository.ResourceRepository;
import com.smartcampus.operationshub.validation.ResourceFilter;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock
    private ResourceRepository resourceRepository;

    private ResourceService resourceService;

    @BeforeEach
    void setUp() {
        resourceService = new ResourceServiceImpl(resourceRepository);
    }

    @Test
    void createResource_shouldReturnSavedResource() {
        ResourceRequest request = new ResourceRequest();
        request.setName("LH A-201");
        request.setType(ResourceType.LECTURE_HALL);
        request.setCapacity(120);
        request.setLocation("Building A - Floor 2");
        request.setStatus(ResourceStatus.ACTIVE);

        Resource saved = new Resource();
        saved.setId(1L);
        saved.setName(request.getName());
        saved.setType(request.getType());
        saved.setCapacity(request.getCapacity());
        saved.setLocation(request.getLocation());
        saved.setStatus(request.getStatus());

        when(resourceRepository.save(any(Resource.class))).thenReturn(saved);

        ResourceResponse response = resourceService.createResource(request);

        assertEquals(1L, response.getId());
        assertEquals("LH A-201", response.getName());
        assertEquals(ResourceType.LECTURE_HALL, response.getType());
    }

    @Test
    void updateResource_shouldThrowWhenNotFound() {
        when(resourceRepository.findById(55L)).thenReturn(Optional.empty());

        ResourceRequest request = new ResourceRequest();
        request.setName("Lab B-11");
        request.setType(ResourceType.LAB);
        request.setCapacity(30);
        request.setLocation("Building B - Floor 1");
        request.setStatus(ResourceStatus.ACTIVE);

        assertThrows(ResourceNotFoundException.class, () -> resourceService.updateResource(55L, request));
    }

    @Test
    void getResourceById_shouldThrowWhenNotFound() {
        when(resourceRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> resourceService.getResourceById(404L));
    }

    @Test
    void getResources_shouldThrowWhenCapacityRangeInvalid() {
        ResourceFilter filter = new ResourceFilter();
        filter.setMinCapacity(100);
        filter.setMaxCapacity(10);

        assertThrows(IllegalArgumentException.class, () -> resourceService.getResources(filter));
    }

    @Test
    void getResources_shouldReturnMappedList() {
        Resource resource = new Resource();
        resource.setId(10L);
        resource.setName("Projector P1");
        resource.setType(ResourceType.PROJECTOR);
        resource.setCapacity(1);
        resource.setLocation("Media Store");
        resource.setStatus(ResourceStatus.ACTIVE);

        when(resourceRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(Sort.class)))
                .thenReturn(List.of(resource));

        List<ResourceResponse> responses = resourceService.getResources(new ResourceFilter());

        assertEquals(1, responses.size());
        assertEquals("Projector P1", responses.get(0).getName());
    }

    @Test
    void deleteResource_shouldDeleteWhenFound() {
        Resource existing = new Resource();
        existing.setId(7L);
        when(resourceRepository.findById(7L)).thenReturn(Optional.of(existing));

        resourceService.deleteResource(7L);

        verify(resourceRepository).delete(existing);
    }
}