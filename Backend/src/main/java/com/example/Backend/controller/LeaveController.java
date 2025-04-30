package com.example.Backend.controller;

import com.example.Backend.config.JwtTokenUtil;
import com.example.Backend.model.Leave;
import com.example.Backend.model.User;
import com.example.Backend.service.LeaveService;
import com.example.Backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaveService;
    private final UserService userService;
    private final JwtTokenUtil jwtTokenUtil;

    @Autowired
    public LeaveController(LeaveService leaveService, UserService userService, JwtTokenUtil jwtTokenUtil) {
        this.leaveService = leaveService;
        this.userService = userService;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    @PostMapping("/apply")
    public ResponseEntity<?> applyLeave(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("fromDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam("toDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam("leaveType") String leaveType,
            @RequestParam("reason") String reason) {

        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);
            String userEmail = jwtTokenUtil.getUsernameFromToken(token);

            // Validate dates
            if (fromDate.isAfter(toDate)) {
                return ResponseEntity.badRequest().body(Map.of("error", "From date cannot be after to date"));
            }

            // Create leave object
            Leave leave = new Leave(userId, userEmail, fromDate, toDate, leaveType, reason);

            // Save leave application
            Leave savedLeave = leaveService.applyLeave(leave);

            return ResponseEntity.status(HttpStatus.CREATED).body(savedLeave);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to apply for leave: " + e.getMessage()));
        }
    }

    @PostMapping("/apply-json")
    public ResponseEntity<?> applyLeaveJson(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> leaveRequest) {

        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user ID and email from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);
            String userEmail = jwtTokenUtil.getUsernameFromToken(token);

            // Parse dates
            LocalDate fromDate = LocalDate.parse(leaveRequest.get("from"));
            LocalDate toDate = LocalDate.parse(leaveRequest.get("to"));

            // Validate dates
            if (fromDate.isAfter(toDate)) {
                return ResponseEntity.badRequest().body(Map.of("error", "From date cannot be after to date"));
            }

            // Create leave object
            Leave leave = new Leave(
                    userId,
                    userEmail,
                    fromDate,
                    toDate,
                    leaveRequest.get("type"),
                    leaveRequest.get("reason")
            );

            // Save leave application
            Leave savedLeave = leaveService.applyLeave(leave);

            // Create success response
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedLeave.getId());
            response.put("status", savedLeave.getStatus());
            response.put("message", "Leave application submitted successfully");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to apply for leave: " + e.getMessage()));
        }
    }
    @GetMapping("/history")
    public ResponseEntity<?> getLeaveHistory(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);

            // Get leave history
            List<Leave> leaveList = leaveService.getUserLeaves(userId);

            return ResponseEntity.ok(leaveList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch leave history: " + e.getMessage()));
        }}

    @GetMapping("/user")
    public ResponseEntity<?> getUserLeaves(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);

            // Get user leaves
            List<Leave> leaves = leaveService.getUserLeaves(userId);

            return ResponseEntity.ok(leaves);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch leaves: " + e.getMessage()));
        }
    }
}
