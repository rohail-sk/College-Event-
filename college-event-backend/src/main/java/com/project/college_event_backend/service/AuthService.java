package com.project.college_event_backend.service;

import com.project.college_event_backend.model.User;
import com.project.college_event_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;

@Service
public class AuthService {
    @Autowired
    private UserRepository repo;


    public User findByEmailAndPasswordAndRole(String email, String password, String role) {
        return repo.findByEmailAndPasswordAndRole(email, password,role);

    }

    public User findByEmailAndPassword(String email, String password) {
        return repo.findByEmailAndPassword(email,password);
    }

    public User save(User req) {
        return repo.save(req);
    }



}
