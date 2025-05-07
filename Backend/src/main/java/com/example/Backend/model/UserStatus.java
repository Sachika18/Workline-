package com.example.Backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatus {
    private String userId;
    private String status; // online, away, offline
    private Date timestamp;
    
    public UserStatus(String userId, String status) {
        this.userId = userId;
        this.status = status;
        this.timestamp = new Date();
    }
}