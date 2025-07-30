package com.project.college_event_backend.repository;

import com.project.college_event_backend.model.EventProposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface EventProposalRepository extends JpaRepository<EventProposal, Long> {
    List<EventProposal> findByFacultyId(long facultyId);
}
