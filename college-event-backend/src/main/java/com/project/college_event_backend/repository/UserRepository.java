package com.project.college_event_backend.repository;

import com.project.college_event_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.password = :password AND u.role = :role")
    User findByEmailAndPasswordAndRole(@Param("email") String email,
                                       @Param("password") String password,
                                       @Param("role") String role);

@Query("SELECT u FROM User u WHERE u.email = :email AND u.password = :password")
    User findByEmailAndPassword(@Param("email")String email, @Param("password")String password);
}
