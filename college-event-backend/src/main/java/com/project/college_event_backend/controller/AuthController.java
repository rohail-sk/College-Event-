package com.project.college_event_backend.controller;

import com.project.college_event_backend.model.User;
import com.project.college_event_backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthService service;

    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody User req){
        User user = service.findByEmailAndPasswordAndRole(req.getEmail(),req.getPassword(),req.getRole());
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.status(404).build();
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User req){
        User existingUser = service.findByEmailAndPassword(req.getEmail(),req.getPassword());
        if(existingUser != null){
            return ResponseEntity.status(409).build();
        }else{
            User newUser = service.save(req);
            newUser.setRole("student"); 
            return ResponseEntity.status(201).body(newUser);
        }
    }



}
