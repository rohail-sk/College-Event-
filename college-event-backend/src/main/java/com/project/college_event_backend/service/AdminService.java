package com.project.college_event_backend.service;

import com.project.college_event_backend.model.Event;
import com.project.college_event_backend.model.User;
import com.project.college_event_backend.repository.AdminRepository;
import com.project.college_event_backend.repository.EventRepository;
import com.project.college_event_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AdminService {
    @Autowired
    private AdminRepository adminRepo;
    @Autowired
    private UserRepository userRepo;
    @Autowired
    private EventRepository eventRepo;

    public void save(User req) {
         userRepo.save(req);
    }

    public User FindByEmailAndPassword(String email, String password) {
        return userRepo.findByEmailAndPassword(email,password);
    }

//    public Event modifyRemarkWithEventId(String remark, long EventId) {
//        int rows = eventRepo.addRemarkWithEventId(remark, EventId);
//        if(rows > 0){
//            return eventRepo.findByEventId(EventId);
//        }else{
//            return null;
//        }
//    }
}
