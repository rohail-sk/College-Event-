package com.project.college_event_backend.repository;

import com.project.college_event_backend.model.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRepository extends JpaRepository<Registration,Long> {
}
