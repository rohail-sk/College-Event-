package com.project.college_event_backend.service;

import com.project.college_event_backend.model.Event;
import com.project.college_event_backend.model.Registration;
import com.project.college_event_backend.model.User;
import com.project.college_event_backend.repository.EventRepository;
import com.project.college_event_backend.repository.StudentRepository;
import com.project.college_event_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class StudentService {
    @Autowired
    private StudentRepository repo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private EventRepository eventRepository;

    public List<Registration> getRegisteredStudents() {
        return repo.findAll();
    }

    public Registration registerStudent(Registration req) {
        User user = userRepo.findById(req.getStudentId()).orElse(null);
        Event event = eventRepository.findByEventId(req.getEventId());
        if(user != null){
            req.setStudentName(user.getName());
            req.setFacultyId(event.getFacultyId());
            req.setStatus("Registered");
            req.setDate(LocalDate.now());
            return repo.save(req);
        }
        else{
            return null;
        }

    }

    public List<Registration> getStudentsByFacultyId(long facultyId) {
        List<Registration> students = repo.findByFacultyId(facultyId);
        if(students != null){
            return students;
        }else{
            return null;
        }
    }

    public Registration findByStudentIdAndEventId(long studentId, long eventId) {
        return repo.findByStudentIdAndEventId(studentId,eventId);
    }

    public List<Registration> allRegisteredEventsByStudent(long studentId) {
        return repo.findByStudentId(studentId);
    }
}
