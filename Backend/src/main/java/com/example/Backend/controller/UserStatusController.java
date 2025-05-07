package com.example.Backend.controller;

import com.example.Backend.model.User;
import com.example.Backend.model.UserStatus;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.service.UserStatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class UserStatusController {

    @Autowired
    private UserStatusService userStatusService;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Update user status via REST API
     */
    @PostMapping("/users/{userId}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable String userId, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        if (status == null || !isValidStatus(status)) {
            return ResponseEntity.badRequest().body("Invalid status");
        }
        
        userStatusService.updateUserStatus(userId, status);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Get all users with their status
     */
    @GetMapping("/users/status")
    public ResponseEntity<?> getAllUsersStatus() {
        List<User> users = userRepository.findAll();
        
        List<Map<String, Object>> usersStatus = users.stream()
            .map(user -> {
                Map<String, Object> userStatus = new HashMap<>();
                userStatus.put("userId", user.getId());
                userStatus.put("name", user.getFirstName() + " " + user.getLastName());
                userStatus.put("status", user.getStatus());
                userStatus.put("lastActivityAt", user.getLastActivityAt());
                return userStatus;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(usersStatus);
    }
    
    /**
     * Handle WebSocket message to update user status
     */
    @MessageMapping("/status")
    @SendTo("/topic/status")
    public UserStatus handleStatusUpdate(UserStatus userStatus) {
        userStatusService.updateUserStatus(userStatus.getUserId(), userStatus.getStatus());
        return userStatus;
    }
    
    /**
     * Check if status is valid
     */
    private boolean isValidStatus(String status) {
        return "online".equals(status) || "away".equals(status) || "offline".equals(status);
    }
}