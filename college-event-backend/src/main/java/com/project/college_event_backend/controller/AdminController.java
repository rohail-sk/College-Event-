package com.project.college_event_backend.controller;

import com.project.college_event_backend.model.Event;
import com.project.college_event_backend.model.User;
import com.project.college_event_backend.service.AdminService;
import com.project.college_event_backend.service.EventsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {
    @Autowired
    private AdminService adminService;
    @Autowired
    private EventsService eventService;
    @PostMapping("/add-faculty")
    public ResponseEntity<User> addNewFaculty(@RequestBody User req){
        User existingUser = adminService.FindByEmailAndPassword(req.getEmail(),req.getPassword());
        if(existingUser == null){
            req.setRole("faculty");
            adminService.save(req);
            return ResponseEntity.status(201).body(existingUser);
        }else{
            return ResponseEntity.status(409).build();
        }
    }

    @PutMapping("/modify-event/{id}")
    public ResponseEntity<Event> modifyRemark(@PathVariable long id,@RequestBody Event event){
//        Event getEvent = eventService.getEventById(EventId);
//
            Event updatedEvent = eventService.updateEvent(id,event);
        if(updatedEvent != null){
            return ResponseEntity.status(200).body(updatedEvent);
        }
        else{
            return ResponseEntity.status(404).build();
        }
    }

}
