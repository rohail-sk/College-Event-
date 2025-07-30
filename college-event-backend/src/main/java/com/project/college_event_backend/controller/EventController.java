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
@PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody Event event){
     event.setStatus("approved");
     return ResponseEntity.ok(service.save(event));
}

@GetMapping("/all-events")
    public ResponseEntity<List<Event>> getAllEvents(){
    List<Event> allEvents = service.getAllEvents();
    if(allEvents.isEmpty()){
        return ResponseEntity.noContent().build();
    }else{
        return ResponseEntity.ok(allEvents);
    }
}


@DeleteMapping("/{id}")
    public void deleteEvent(@PathVariable long id){
    service.deleteEvent(id);
}
}
