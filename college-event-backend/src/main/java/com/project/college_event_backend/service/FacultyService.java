package com.project.college_event_backend.service;

import com.project.college_event_backend.model.Registration;
import com.project.college_event_backend.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FacultyService {
    @Autowired
    private StudentRepository repo;

    public List<Registration> findAllByFacultyId(long facultyId) {
        List<Registration> registrations = repo.findByFacultyId(facultyId);
        return registrations;
    }

    public List<Registration> findAllByEventId(long eventId) {
        List<Registration> registrations = repo.findByEventId(eventId);
        return registrations;
    }
}
