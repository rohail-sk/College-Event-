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
    @PostMapping("/request-event")
    public ResponseEntity<Event> EventProposalFromFaculty(@RequestBody Event req){
        req.setStatus("Pending");
        Event newEvent = service.EventProposalFromFaculty(req);

        if(newEvent != null){
            return ResponseEntity.status(201).body(newEvent);
        }else{
            return ResponseEntity.status(400).build();
        }
    }

    @GetMapping("/all-requested-events")
    public ResponseEntity <List<Event>> EventRequestForAdmin(){
        List<Event>allRequestedEvents = service.getAllEventProposals();
        if(allRequestedEvents.isEmpty()){
            return ResponseEntity.noContent().build();
        }else{
            return ResponseEntity.ok(allRequestedEvents);
        }
    }

    @GetMapping("/all-requested-events/{id}")
    public ResponseEntity <List<Event>> EventRequestForAdmin(@PathVariable long id){
        List<Event>allRequestedEvents = service.getAllEventProposalsById(id);
        if(allRequestedEvents.isEmpty()){
            return ResponseEntity.noContent().build();
        }else{
            return ResponseEntity.ok(allRequestedEvents);
        }
    }

    @PostMapping("/approve-event/{id}")
    public ResponseEntity<?> approvedEvents(@PathVariable long id){
        Event eventProposal = service.getEventProposalById(id);
        if(eventProposal != null){
            eventProposal.setStatus("Approved");
            service.saveProposal(eventProposal);
            return ResponseEntity.ok(eventProposal);
        }else{
            return ResponseEntity.status(404).build();
        }
    }

    @PostMapping("/reject-event/{id}")
    public ResponseEntity<?> rejectEvent(@PathVariable long id){
        Event eventProposal = service.getEventProposalById(id);
        if(eventProposal != null){
            eventProposal.setStatus("Rejected");
            service.saveProposal(eventProposal);
            return ResponseEntity.ok(eventProposal);
        }else{
            return ResponseEntity.status(404).build();
        }
    }

    @GetMapping("/event-by-id/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable long id){
    Event event = service.getEventById(id);
    if(event != null){
        return ResponseEntity.ok(event);
    }else{
        return ResponseEntity.status(404).build();
    }
    }

    @PutMapping("/edit-existing-event/{id}")
    public ResponseEntity<Event> updateEvent(@PathVariable long id , @RequestBody Event updateEvent){
        Event existingEvent = service.getEventById(id);
        if(existingEvent != null){
            Event updatedEvent = service.updateEvent(id,updateEvent);
            //service.deleteEventByIdAndStatus(id);
            return ResponseEntity.ok(updatedEvent);
        }
        else{
            return ResponseEntity.status(404).build();
        }
    }

    @DeleteMapping("/delete-existing-event/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable long id){
        Event event = service.getEventById(id);
        if(event != null){
            service.deleteEvent(event);
            return ResponseEntity.noContent().build();
        }else{
            return ResponseEntity.status(404).build();
        }
    }

}
