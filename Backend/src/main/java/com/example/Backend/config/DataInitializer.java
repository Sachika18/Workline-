package com.example.Backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.Backend.model.User;
import com.example.Backend.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("DataInitializer is running...");
        System.out.println("Current user count: " + userRepository.count());
        
        // Check if we already have users
        if (userRepository.count() == 0) {
            try {
                // Create admin user
                User adminUser = new User(
                        "Admin",
                        "User",
                        "admin@example.com",
                        passwordEncoder.encode("admin123"),
                        "Admin"
                );
                User savedAdmin = userRepository.save(adminUser);
                System.out.println("Admin user created with ID: " + savedAdmin.getId());
                
                // Create regular user
                User regularUser = new User(
                        "Regular",
                        "User",
                        "user@example.com",
                        passwordEncoder.encode("password"),
                        "Staff"
                );
                User savedRegular = userRepository.save(regularUser);
                System.out.println("Regular user created with ID: " + savedRegular.getId());
                
                System.out.println("Default users created successfully.");
            } catch (Exception e) {
                System.err.println("Error creating default users: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("Users already exist, skipping initialization.");
        }
    }
}