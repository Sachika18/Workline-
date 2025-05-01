package com.example.Backend.controller;

import com.example.Backend.config.JwtTokenUtil;
import com.example.Backend.model.Task;
import com.example.Backend.model.User;
import com.example.Backend.service.TaskService;
import com.example.Backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    // Create a new task
    @PostMapping
    public ResponseEntity<Task> createTask(
            @RequestBody Map<String, Object> taskRequest,
            @RequestHeader("Authorization") String authHeader) {
        
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            
            // Get user ID from token
            String adminId = jwtTokenUtil.getUserIdFromToken(token);
            
            // Extract task details from request
            String title = (String) taskRequest.get("title");
            String description = (String) taskRequest.get("description");
            String assignedTo = (String) taskRequest.get("assignedTo");
            LocalDate dueDate = LocalDate.parse((String) taskRequest.get("dueDate"));
            
            // Create the task
            Task newTask = taskService.createTask(title, description, assignedTo, dueDate, adminId);
            
            return new ResponseEntity<>(newTask, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
    
    // Get all tasks
    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks() {
        System.out.println("TaskController: getAllTasks() called");
        List<Task> tasks = taskService.getAllTasks();
        System.out.println("TaskController: Found " + tasks.size() + " tasks");
        return new ResponseEntity<>(tasks, HttpStatus.OK);
    }
    
    // Get task by ID
    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable String id) {
        Task task = taskService.getTaskById(id);
        return new ResponseEntity<>(task, HttpStatus.OK);
    }
    
    // Get tasks assigned to a specific user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Task>> getTasksByUser(@PathVariable String userId) {
        List<Task> tasks = taskService.getTasksByUser(userId);
        return new ResponseEntity<>(tasks, HttpStatus.OK);
    }
    
    // Get tasks assigned to the current user
    @GetMapping("/my-tasks")
    public ResponseEntity<List<Task>> getMyTasks(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            
            // Get user ID from token
            String userId = jwtTokenUtil.getUserIdFromToken(token);
            
            List<Task> tasks = taskService.getTasksByUser(userId);
            return new ResponseEntity<>(tasks, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
    }
    
    // Update task status
    @PatchMapping("/{id}/status")
    public ResponseEntity<Task> updateTaskStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> statusUpdate) {
        
        Task.TaskStatus newStatus = Task.TaskStatus.valueOf(statusUpdate.get("status").toUpperCase());
        Task updatedTask = taskService.updateTaskStatus(id, newStatus);
        
        return new ResponseEntity<>(updatedTask, HttpStatus.OK);
    }
    
    // Delete a task
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable String id) {
        taskService.deleteTask(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}