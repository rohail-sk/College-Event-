//package com.project.college_event_backend.service;
//
//import com.project.college_event_backend.model.EventProposal;
//import com.project.college_event_backend.repository.EventProposalRepository;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//
//import java.util.List;
//
//@Service
//public class EventProposalService {
//    @Autowired
//   private EventProposalRepository repo;
//    public EventProposal EventProposalFromFaculty(EventProposal req) {
//        return repo.save(req);
//    }
//
//    public List<EventProposal> getAllEventProposals() {
//
//        return repo.findAll();
//    }
//
//    public EventProposal getEventProposalById(long id) {
//        return repo.findById(id).orElse(null);
//    }
//
//    public void saveProposal(EventProposal eventProposal) {
//        repo.save(eventProposal);
//    }
//}
