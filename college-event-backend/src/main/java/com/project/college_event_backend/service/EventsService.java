package com.project.college_event_backend.service;

import com.project.college_event_backend.model.Event;
import com.project.college_event_backend.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class EventsService {
    @Autowired
    private EventRepository repo;

    public Event save(Event event) {
            return repo.save(event);
    }

    public List<Event> getAllEvents() {
        return repo.findByStatus("Approved");
    }
    public Event EventProposalFromFaculty(Event req) {
        return repo.save(req);
    }

    public List<Event> getAllEventProposals() {
        return repo.findAll();
    }

    public Event getEventProposalById(long id) {
        return repo.findById(id).orElse(null);
    }

    public void saveProposal(Event eventProposal) {
        repo.save(eventProposal);
    }

    public List<Event> getAllEventProposalsById(long id) {
        return repo.findByFacultyId(id);
    }
}


