package com.project.college_event_backend.controller;

import com.project.college_event_backend.model.Event;
import com.project.college_event_backend.service.EventsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "http://localhost:3000")
public class EventController {
    @Autowired
    private EventsService service;

@GetMapping("/all-events")
    public ResponseEntity<List<Event>> getAllEvents(){
    List<Event> allEvents = service.getAllEvents();
    if(allEvents.isEmpty()){
        return ResponseEntity.noContent().build();
    }else{
        return ResponseEntity.ok(allEvents);
    }
}

@PostMapping("/create-event")
    public ResponseEntity<Event> createEvent(@RequestBody Event req){
    Event event = service.save(req);
    if(event != null){
        return ResponseEntity.status(201).body(event);
    }
    else{
        return ResponseEntity.status(400).build();
    }
}
}
