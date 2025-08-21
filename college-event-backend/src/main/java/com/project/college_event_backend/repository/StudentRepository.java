package com.project.college_event_backend.repository;

import com.project.college_event_backend.model.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRepository extends JpaRepository<Registration,Long> {

@Query("SELECT u FROM Registration u WHERE u.facultyId = :facultyId")
    List<Registration> findByFacultyId(long facultyId);

@Query("SELECT u FROM Registration u WHERE u.studentId = :studentId AND u.eventId = :eventId")
    Registration findByStudentIdAndEventId(long studentId, long eventId);

@Query("SELECT u FROM Registration u WHERE u.studentId = :studentId")
    List<Registration> findByStudentId(long studentId);
}
