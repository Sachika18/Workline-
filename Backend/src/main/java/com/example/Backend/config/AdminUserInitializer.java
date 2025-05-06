package com.example.Backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.Backend.model.User;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.service.EmployeeIdService;

@Component
@Order(1) // Run before EmployeeIdUpdater
public class AdminUserInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmployeeIdService employeeIdService;

    @Autowired
    public AdminUserInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder, EmployeeIdService employeeIdService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.employeeIdService = employeeIdService;
    }

    @Override
    public void run(String... args) {
        // Check if admin user already exists
        if (!userRepository.existsByEmail("admin@example.com")) {
            // Create admin user
            User adminUser = new User();
            adminUser.setFirstName("Admin");
            adminUser.setLastName("User");
            adminUser.setEmail("admin@example.com");
            adminUser.setPassword(passwordEncoder.encode("admin123"));
            adminUser.setPosition("Admin");
            adminUser.setEmployeeId("1A001"); // Set a fixed employee ID for the admin
            
            // Save admin user
            userRepository.save(adminUser);
            
            System.out.println("Admin user created: admin@example.com / admin123");
        }
    }
}