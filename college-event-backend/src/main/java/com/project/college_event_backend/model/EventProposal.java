//package com.project.college_event_backend.model;
//
//import com.fasterxml.jackson.annotation.JsonFormat;
//import com.fasterxml.jackson.annotation.JsonProperty;
//import jakarta.persistence.*;
//import lombok.*;
//
//import java.time.LocalDate;
//
//@Entity
//@Data
//@AllArgsConstructor
//@NoArgsConstructor
//public class EventProposal {
//    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private long id;
//
//    private long facultyId;
//    private String title;
//    private String description;
//    private String status;
//    @Column(nullable = false)
//    @JsonProperty("date")
//    private LocalDate eventDate;
//
//    public LocalDate getEventDate() {
//        return eventDate;
//    }
//
//    public void setEventDate(LocalDate   eventDate) {
//        this.eventDate = eventDate;
//    }
//
//    public long getId() {
//        return id;
//    }
//
//    public void setId(long id) {
//        this.id = id;
//    }
//
//    public long getFacultyId() {
//        return facultyId;
//    }
//
//    public void setFacultyId(long facultyId) {
//        this.facultyId = facultyId;
//    }
//
//    public String getTitle() {
//        return title;
//    }
//
//    public void setTitle(String title) {
//        this.title = title;
//    }
//
//    public String getDescription() {
//        return description;
//    }
//
//    public void setDescription(String description) {
//        this.description = description;
//    }
//
//    public String getStatus() {
//        return status;
//    }
//
//    public void setStatus(String status) {
//        this.status = status;
//    }
//
//
//
//}
