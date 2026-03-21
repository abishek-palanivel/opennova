package com.opennova.config;

import com.opennova.model.User;
import com.opennova.repository.UserRepository;
import com.opennova.service.FallbackImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private FallbackImageService fallbackImageService;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("🔧 DataInitializer: Starting initialization...");
        
        // Create fallback images first
        try {
            fallbackImageService.createFallbackImages();
        } catch (Exception e) {
            System.err.println("❌ Failed to create fallback images: " + e.getMessage());
        }
        
        // Update user passwords
        try {
            // Get all users
            List<User> users = userRepository.findAll();
            System.out.println("📊 Found " + users.size() + " users in database");
            
            String standardPassword = "abi@1234";
            String encodedPassword = passwordEncoder.encode(standardPassword);
            
            int updatedCount = 0;
            for (User user : users) {
                // Update password for all users
                user.setPassword(encodedPassword);
                userRepository.save(user);
                updatedCount++;
                System.out.println("✅ Updated password for user: " + user.getEmail() + " (Role: " + user.getRole() + ")");
            }
            
            System.out.println("🎉 DataInitializer: Successfully updated passwords for " + updatedCount + " users");
            System.out.println("🔑 All users now have password: " + standardPassword);
            
        } catch (Exception e) {
            System.err.println("❌ DataInitializer: Error updating passwords: " + e.getMessage());
            e.printStackTrace();
        }
    }
}