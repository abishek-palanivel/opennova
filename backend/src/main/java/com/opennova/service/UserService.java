package com.opennova.service;

import com.opennova.model.User;
import com.opennova.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    public User findByEmailSafe(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }

    public Optional<User> findByResetToken(String token) {
        return userRepository.findByResetToken(token);
    }

    public long getTotalUsers() {
        return userRepository.count();
    }

    public long getActiveUsers() {
        return userRepository.countByIsActive(true);
    }

    public long getSuspendedUsers() {
        return userRepository.countByIsActive(false);
    }

    // Admin methods
    public List<User> findAllForAdmin() {
        return userRepository.findAll();
    }

    public User updateUserStatus(Long id, Boolean isActive) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                Boolean previousStatus = user.getIsActive();
                user.setIsActive(isActive);
                User savedUser = userRepository.save(user);
                
                // Send email notification about status change
                try {
                    if (isActive && (previousStatus == null || !previousStatus)) {
                        // User was activated
                        emailService.sendAccountActivationEmail(user);
                        System.out.println("✅ Account activation email sent to: " + user.getEmail());
                    } else if (!isActive && (previousStatus == null || previousStatus)) {
                        // User was deactivated
                        emailService.sendAccountSuspensionEmail(user);
                        System.out.println("⚠️ Account suspension email sent to: " + user.getEmail());
                    }
                } catch (Exception emailError) {
                    System.err.println("❌ Failed to send status change email: " + emailError.getMessage());
                    // Don't fail the status update if email fails
                }
                
                return savedUser;
            }
            return null;
        } catch (Exception e) {
            System.err.println("Error updating user status: " + e.getMessage());
            return null;
        }
    }

    public boolean deleteUser(Long id) {
        try {
            if (userRepository.existsById(id)) {
                userRepository.deleteById(id);
                return true;
            }
            return false;
        } catch (Exception e) {
            System.err.println("Error deleting user: " + e.getMessage());
            return false;
        }
    }

    // Analytics methods
    public long getUsersThisMonth() {
        // Mock implementation - replace with actual date-based query
        return userRepository.count() / 2;
    }

    public long getUsersLastMonth() {
        // Mock implementation - replace with actual date-based query
        return userRepository.count() / 3;
    }

    public double getUserGrowthRate() {
        // Mock implementation - replace with actual calculation
        long thisMonth = getUsersThisMonth();
        long lastMonth = getUsersLastMonth();
        if (lastMonth == 0) return 100.0;
        return ((double)(thisMonth - lastMonth) / lastMonth) * 100.0;
    }

    public List<Map<String, Object>> getMonthlyUserGrowth() {
        // Mock implementation - replace with actual monthly data
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", "Month " + (i + 1));
            monthData.put("users", userRepository.count() / (12 - i));
            monthlyData.add(monthData);
        }
        return monthlyData;
    }
}