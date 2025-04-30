package com.example.Backend.repository;

import com.example.Backend.model.Attendance;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends MongoRepository<Attendance, String> {

    // Find attendance record between two dates (used for today's attendance)
    Optional<Attendance> findByUserIdAndDateBetween(String userId, LocalDateTime startDate, LocalDateTime endDate);

    // Find attendance records by user and date range
    List<Attendance> findByUserIdAndDateBetweenOrderByDateDesc(String userId, LocalDateTime startDate, LocalDateTime endDate);

    // Find most recent attendance records for a user
    @Query(value = "{ 'userId': ?0 }", sort = "{ 'date': -1 }")
    List<Attendance> findByUserIdOrderByDateDesc(String userId, Pageable pageable);

    // Helper method to limit results
    default List<Attendance> findByUserIdOrderByDateDesc(String userId, int limit) {
        return findByUserIdOrderByDateDesc(userId, org.springframework.data.domain.PageRequest.of(0, limit));
    }
}