package com.project.college_event_backend.controller;

import com.project.college_event_backend.model.Registration;
import com.project.college_event_backend.service.FacultyService;
import com.project.college_event_backend.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/faculty")
public class FacultyController {
    @Autowired
    private FacultyService service;

//    @GetMapping("/all-registrations/{facultyId}")
//    public ResponseEntity<List<Registration>> allRegisteredEventsByFacultyID(@PathVariable long facultyId){
//        List<Registration> registrations = service.findAllByFacultyId(facultyId);
//        if(registrations != null){
//            return ResponseEntity.ok(registrations);
//        }else{
//            return ResponseEntity.status(404).build();
//        }
//    }

    @GetMapping("/all-registrations/{eventId}")
    public ResponseEntity<List<Registration>> allRegisteredEventsByEventID(@PathVariable long eventId){
        List<Registration> registrations = service.findAllByEventId(eventId);
        if(registrations != null){
            return ResponseEntity.ok(registrations);
        }else{
            return ResponseEntity.status(404).build();
        }
    }

}
