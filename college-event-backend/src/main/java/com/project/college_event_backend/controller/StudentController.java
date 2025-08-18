package com.project.college_event_backend.controller;

import com.project.college_event_backend.model.Registration;
import com.project.college_event_backend.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {
    @Autowired
    private StudentService service;

    @GetMapping("/all-registered-students")
    public ResponseEntity<List<Registration>> registeredStudents(){
        List<Registration> registered = service.getRegisteredStudents();
        if(registered != null){
            return ResponseEntity.ok(registered);
        }else{
            return ResponseEntity.status(404).build();
        }
    }

    @PostMapping("/register-student")
    public ResponseEntity<Registration> register(@RequestBody Registration req){
        Registration student = service.registerStudent(req);
        if(student != null){
            return ResponseEntity.status(201).body(student);
        }else{
            return ResponseEntity.status(404).build();
        }
    }

//    @GetMapping("/get-students-by-faculty-id")
//    public ResponseEntity<List<Registration>> studentsByFacultyId(@PathVariable long facultyId){
//        Registration students = service.getStuentsByFacultyId(facultyId);
//
//    }
}
