package com.project.college_event_backend.controller;

import com.project.college_event_backend.model.Registration;
import com.project.college_event_backend.service.StudentService;
import org.apache.coyote.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
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

    @GetMapping("/get-students-by-faculty-id/{facultyId}")
    public ResponseEntity<List<Registration>> studentsByFacultyId(@PathVariable long facultyId){
        List<Registration> students = service.getStudentsByFacultyId(facultyId);
        if(students != null){
            return ResponseEntity.ok(students);
        }else{
            return ResponseEntity.status(404).build();
        }
    }

@GetMapping("/check-registration/{studentId}/{eventId}")
    public ResponseEntity<Registration> checkStatus(@PathVariable long studentId, @PathVariable long eventId){
        Registration registration = service.findByStudentIdAndEventId(studentId,eventId);
        if(registration != null){
            return ResponseEntity.ok(registration);
        }else{
            return ResponseEntity.status(404).build();
        }
    }

    @GetMapping("/all-events-registered-by-student/{studentId}")
    public ResponseEntity<List<Registration>> allRegisteredEventsByStudent(@PathVariable long studentId){
        List<Registration>  Events = service.allRegisteredEventsByStudent(studentId);
        if(Events != null){
            return ResponseEntity.ok(Events);
        }else{
            return ResponseEntity.status(404).build();
        }
    }

    @DeleteMapping("/delete-student")
    public ResponseEntity<?> delete(@RequestBody Registration req){
        Registration student = service.findById(req.getId());
        if(student != null){
            service.deleteRegistration(student);
            return ResponseEntity.noContent().build();
        }else{
            return ResponseEntity.status(404).build();
        }
    }

}
