package com.project.college_event_backend.repository;

import com.project.college_event_backend.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStatus(String status);
    List<Event> findByFacultyId(long facultyId);
    @Query("SELECT ep FROM Event ep WHERE ep.status = 'Pending'")
   List<Event> findAllByPendingStatus();
}
