package com.project.college_event_backend.controller;

import com.project.college_event_backend.model.EventProposal;
import com.project.college_event_backend.service.EventProposalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/event-proposal")
public class EventProposalController {
    @Autowired
   private EventProposalService service;

    @PostMapping("/request-event")
    public ResponseEntity<EventProposal> EventProposalFromFaculty(@RequestBody EventProposal req){
        req.setStatus("Pending");
        EventProposal newEvent = service.EventProposalFromFaculty(req);

        if(newEvent != null){
            return ResponseEntity.status(201).body(newEvent);
        }else{
            return ResponseEntity.status(400).build();
        }
    }

    @GetMapping("/all-requested-events")
    public ResponseEntity <List<EventProposal>> EventRequestForAdmin(){
        List<EventProposal>allRequestedEvents = service.getAllEventProposals();
        if(allRequestedEvents.isEmpty()){
            return ResponseEntity.noContent().build();
        }else{
            return ResponseEntity.ok(allRequestedEvents);
        }
    }

@PostMapping("/approve-event/{id}")
    public ResponseEntity<?> approvedEvents(@PathVariable long id){
        EventProposal eventProposal = service.getEventProposalById(id);
        if(eventProposal != null){
            eventProposal.setStatus("Approved");
            service.saveProposal(eventProposal);
            return ResponseEntity.ok(eventProposal);
        }else{
            return ResponseEntity.status(404).build();
        }
    }
}
