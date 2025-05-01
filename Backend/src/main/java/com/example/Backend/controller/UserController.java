package com.example.Backend.controller;

import com.example.Backend.model.User;
import com.example.Backend.service.UserService;
import com.example.Backend.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // Get all users
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        System.out.println("UserController: getAllUsers() called");
        List<User> users = userService.findAllUsers();
        System.out.println("UserController: Found " + users.size() + " users");
        
        // Remove sensitive information like passwords before sending to client
        List<User> sanitizedUsers = users.stream()
            .map(user -> {
                User sanitizedUser = new User();
                sanitizedUser.setId(user.getId());
                sanitizedUser.setFirstName(user.getFirstName());
                sanitizedUser.setLastName(user.getLastName());
                sanitizedUser.setEmail(user.getEmail());
                sanitizedUser.setPosition(user.getPosition());
                sanitizedUser.setAvatar(user.getAvatar());
                return sanitizedUser;
            })
            .collect(Collectors.toList());
        
        return new ResponseEntity<>(sanitizedUsers, HttpStatus.OK);
    }
    
    // Get user by ID
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        User user = userService.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        // Remove sensitive information
        user.setPassword(null);
        
        return new ResponseEntity<>(user, HttpStatus.OK);
    }
    
    // Get current user
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        // Remove sensitive information
        user.setPassword(null);
        
        return new ResponseEntity<>(user, HttpStatus.OK);
    }
}