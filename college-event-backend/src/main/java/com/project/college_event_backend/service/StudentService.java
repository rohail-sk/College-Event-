package com.project.college_event_backend.service;

import com.project.college_event_backend.model.Registration;
import com.project.college_event_backend.model.User;
import com.project.college_event_backend.repository.StudentRepository;
import com.project.college_event_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {
    @Autowired
    private StudentRepository repo;

    @Autowired
    private UserRepository userRepo;
    public List<Registration> getRegisteredStudents() {
        return repo.findAll();
    }

    public Registration registerStudent(Registration req) {
        User user = userRepo.findById(req.getStudentId()).orElse(null);
        if(user != null){
            req.setStudentName(user.getName());
            return repo.save(req);
        }
        else{
            return null;
        }

    }
}
