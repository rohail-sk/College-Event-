package com.project.college_event_backend.repository;

import com.project.college_event_backend.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStatus(String status);
    List<Event> findAllByFacultyId(long facultyId);
    @Query("SELECT ep FROM Event ep WHERE ep.status = 'Pending'")
   List<Event> findByPendingStatus();

    @Transactional
    @Modifying
    @Query("UPDATE Event e SET e.remark = :remark WHERE e.id = :id")
    int addRemarkWithEventId(@Param("remark") String remark,@Param("id") long id);

    @Query("SELECT e FROM Event e WHERE e.id = :id")
    Event findByEventId(@Param("id") long id);
}
