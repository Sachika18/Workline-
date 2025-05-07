package com.example.Backend.service;

import com.example.Backend.model.User;
import com.example.Backend.model.UserStatus;
import com.example.Backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class UserStatusService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Store active users with their last activity timestamp
    private final Map<String, Date> activeUsers = new HashMap<>();
    
    // Activity timeout in milliseconds (5 minutes)
    private static final long ACTIVITY_TIMEOUT = 5 * 60 * 1000;
    
    // Scheduler for checking inactive users
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    
    public UserStatusService() {
        // Schedule a task to check for inactive users every minute
        scheduler.scheduleAtFixedRate(this::checkInactiveUsers, 1, 1, TimeUnit.MINUTES);
    }
    
    /**
     * Check for inactive users and update their status
     */
    private void checkInactiveUsers() {
        Date now = new Date();
        activeUsers.entrySet().removeIf(entry -> {
            String userId = entry.getKey();
            Date lastActivity = entry.getValue();
            
            // If last activity is older than the timeout, remove user from active list
            if (now.getTime() - lastActivity.getTime() > ACTIVITY_TIMEOUT) {
                updateUserStatus(userId, "offline");
                return true;
            }
            return false;
        });
    }
    
    /**
     * Update user status
     */
    public void updateUserStatus(String userId, String status) {
        try {
            // Find user
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return;
            }
            
            // Update user status
            user.setStatus(status);
            user.setLastActivityAt(new Date());
            userRepository.save(user);
            
            // Update active users map
            if ("online".equals(status)) {
                activeUsers.put(userId, new Date());
            } else if ("offline".equals(status)) {
                activeUsers.remove(userId);
            }
            
            // Notify all clients about the status change
            UserStatus userStatus = new UserStatus(userId, status);
            messagingTemplate.convertAndSend("/topic/status", userStatus);
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * Get user status
     */
    public String getUserStatus(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        return user != null ? user.getStatus() : "offline";
    }
}