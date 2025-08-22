package com.project.college_event_backend.service;

import com.project.college_event_backend.model.Event;
import com.project.college_event_backend.model.User;
import com.project.college_event_backend.repository.EventRepository;
import com.project.college_event_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class EventsService {
    @Autowired
    private EventRepository repo;
    @Autowired
    private UserRepository userRepo;

    public Event save(Event event) {
        User user = userRepo.findById(event.getFacultyId()).orElse(null);
        if(user != null){
            event.setFacultyName(user.getName());
        }
        return repo.save(event);
    }

    public List<Event> getAllEvents() {
        return repo.findByStatus("Approved");
    }
    public Event EventProposalFromFaculty(Event req) {
        User user = userRepo.findById(req.getFacultyId()).orElse(null);
        if(user != null){
            req.setFacultyName(user.getName());
        }
        return repo.save(req);
    }

    public List<Event> getAllEventProposals() {
        return repo.findAll();
    }

    public Event getEventProposalById(long id) {
        return repo.findById(id).orElse(null);
    }

    public void saveProposal(Event eventProposal) {
        User user = userRepo.findById(eventProposal.getFacultyId()).orElse(null);
        if(user != null){
            eventProposal.setFacultyName(user.getName());
        }
        repo.save(eventProposal);
    }

    public List<Event> getAllEventProposalsById(long id) {
        return repo.findAllByFacultyId(id);
    }

    public Event getEventById(long id) {
        return repo.findByEventId(id);
    }

    public Event updateEvent(long id, Event updatedEvent){
        Event event = repo.findById(id).orElse(null);
        if (event != null) {
            event.setDate(updatedEvent.getDate());
            event.setDescription(updatedEvent.getDescription());
            event.setRemark(updatedEvent.getRemark());
            event.setStatus(updatedEvent.getStatus());
            event.setTitle(updatedEvent.getTitle());
            event.setFacultyId(updatedEvent.getFacultyId());
            event.setFacultyName(updatedEvent.getFacultyName());
            repo.save(event);
            return event;
        }else{
            return null;
        }

    }

//    public Event updateEvent(Event updateEvent) {
//        return repo.save(updateEvent);
//    }

    public void deleteEventByIdAndStatus(long id) {
        Event event = repo.findByEventId(id);
        if(event.getStatus().equalsIgnoreCase("Rejected")){
            repo.delete(event);
        }
    }

    public void deleteEvent(Event event) {
        repo.delete(event);
    }

}


