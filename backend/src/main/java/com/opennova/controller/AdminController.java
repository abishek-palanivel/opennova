package com.opennova.controller;

import com.opennova.model.*;
import com.opennova.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*", "https://localhost:*", "https://127.0.0.1:*"}, allowCredentials = "true")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private EstablishmentService establishmentService;

    @Autowired
    private UserService userService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private EstablishmentRequestService establishmentRequestService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Dashboard Statistics
    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // Basic counts
            stats.put("totalUsers", userService.getTotalUsers());
            stats.put("totalEstablishments", establishmentService.getTotalEstablishments());
            stats.put("totalBookings", bookingService.getTotalBookings());
            stats.put("totalReviews", reviewService.getTotalReviews());
            
            // Active counts
            stats.put("activeEstablishments", establishmentService.getActiveEstablishments());
            stats.put("activeUsers", userService.getActiveUsers());
            
            // Status breakdowns
            stats.put("pendingRequests", establishmentRequestService.getPendingRequestsCount());
            stats.put("pendingReviews", reviewService.getPendingReviewsCount());
            
            // Revenue
            stats.put("totalRevenue", bookingService.getTotalRevenue());
            stats.put("monthlyRevenue", bookingService.getMonthlyRevenue());
            
            // Establishment types
            stats.put("establishmentsByType", establishmentService.getEstablishmentCountByType());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch dashboard stats: " + e.getMessage()));
        }
    }

    // Analytics Endpoints
    @GetMapping("/analytics/overview")
    public ResponseEntity<?> getAnalyticsOverview() {
        try {
            Map<String, Object> overview = new HashMap<>();
            
            overview.put("totalUsers", userService.getTotalUsers());
            overview.put("totalEstablishments", establishmentService.getTotalEstablishments());
            overview.put("totalBookings", bookingService.getTotalBookings());
            overview.put("totalRevenue", bookingService.getTotalRevenue());
            overview.put("averageRating", reviewService.getAverageRating());
            
            return ResponseEntity.ok(overview);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch analytics overview: " + e.getMessage()));
        }
    }

    @GetMapping("/analytics/user-growth")
    public ResponseEntity<?> getUserGrowth() {
        try {
            Map<String, Object> userGrowth = new HashMap<>();
            
            // Mock data for user growth - replace with actual implementation
            userGrowth.put("thisMonth", userService.getUsersThisMonth());
            userGrowth.put("lastMonth", userService.getUsersLastMonth());
            userGrowth.put("growthRate", userService.getUserGrowthRate());
            userGrowth.put("monthlyData", userService.getMonthlyUserGrowth());
            
            return ResponseEntity.ok(userGrowth);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch user growth: " + e.getMessage()));
        }
    }

    @GetMapping("/analytics/revenue-overview")
    public ResponseEntity<?> getRevenueOverview() {
        try {
            Map<String, Object> revenue = new HashMap<>();
            
            revenue.put("totalRevenue", bookingService.getTotalRevenue());
            revenue.put("monthlyRevenue", bookingService.getMonthlyRevenue());
            revenue.put("dailyRevenue", bookingService.getDailyRevenue());
            revenue.put("revenueGrowth", bookingService.getRevenueGrowthRate());
            
            return ResponseEntity.ok(revenue);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch revenue overview: " + e.getMessage()));
        }
    }

    @GetMapping("/analytics/booking-trends")
    public ResponseEntity<?> getBookingTrends() {
        try {
            Map<String, Object> trends = new HashMap<>();
            
            trends.put("totalBookings", bookingService.getTotalBookings());
            trends.put("confirmedBookings", bookingService.getConfirmedBookingsCount());
            trends.put("pendingBookings", bookingService.getPendingBookingsCount());
            trends.put("cancelledBookings", bookingService.getCancelledBookingsCount());
            trends.put("monthlyTrends", bookingService.getMonthlyBookingTrends());
            
            return ResponseEntity.ok(trends);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch booking trends: " + e.getMessage()));
        }
    }

    @GetMapping("/analytics/establishment-distribution")
    public ResponseEntity<?> getEstablishmentDistribution() {
        try {
            Map<String, Object> distribution = new HashMap<>();
            
            distribution.put("byType", establishmentService.getEstablishmentCountByType());
            distribution.put("byStatus", establishmentService.getEstablishmentCountByStatus());
            distribution.put("byCity", establishmentService.getEstablishmentCountByCity());
            
            return ResponseEntity.ok(distribution);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch establishment distribution: " + e.getMessage()));
        }
    }

    // Data Management Endpoints
    @GetMapping("/establishments")
    public ResponseEntity<?> getAllEstablishments() {
        try {
            List<Establishment> establishments = establishmentService.findAllForAdmin();
            return ResponseEntity.ok(establishments);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch establishments: " + e.getMessage()));
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userService.findAllForAdmin();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch users: " + e.getMessage()));
        }
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getAllRequests() {
        try {
            List<EstablishmentRequest> requests = establishmentRequestService.getAllRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch requests: " + e.getMessage()));
        }
    }

    @GetMapping("/reviews")
    public ResponseEntity<?> getAllReviews() {
        try {
            List<java.util.Map<String, Object>> reviews = reviewService.getAllReviewsForAdmin();
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch reviews: " + e.getMessage()));
        }
    }

    // Establishment Management
    @PostMapping("/establishments")
    public ResponseEntity<?> createEstablishment(@RequestBody Map<String, Object> establishmentData) {
        try {
            // Extract establishment data
            String name = (String) establishmentData.get("name");
            String type = (String) establishmentData.get("type");
            String email = (String) establishmentData.get("email");
            String address = (String) establishmentData.get("address");
            String city = (String) establishmentData.get("city");
            String state = (String) establishmentData.get("state");
            String pincode = (String) establishmentData.get("pincode");
            String phoneNumber = (String) establishmentData.get("phoneNumber");
            String operatingHours = (String) establishmentData.get("operatingHours");
            String upiId = (String) establishmentData.get("upiId");
            String ownerPassword = (String) establishmentData.get("ownerPassword");
            
            System.out.println("🔐 Direct establishment creation - Password provided: " + (ownerPassword != null && !ownerPassword.trim().isEmpty()));
            if (ownerPassword != null && !ownerPassword.trim().isEmpty()) {
                System.out.println("🔐 Using admin-provided password (length: " + ownerPassword.length() + ")");
            } else {
                System.out.println("🔐 No password provided, will use default password");
            }
            
            // Validate required fields
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Establishment name is required"));
            }
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }
            if (address == null || address.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Address is required"));
            }
            if (type == null || type.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Establishment type is required"));
            }
            
            // Validate email format
            if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid email format"));
            }
            
            // Check for existing establishment with this email BEFORE processing
            try {
                Establishment existingEst = establishmentService.findByEmail(email);
                if (existingEst != null) {
                    return ResponseEntity.status(409).body(Map.of(
                        "error", String.format("An establishment with email '%s' already exists: %s", email, existingEst.getName()),
                        "type", "DUPLICATE_EMAIL",
                        "existingEstablishment", Map.of(
                            "id", existingEst.getId(),
                            "name", existingEst.getName(),
                            "type", existingEst.getType().name()
                        )
                    ));
                }
            } catch (Exception e) {
                // If findByEmail throws exception, it means no establishment exists, which is good
                System.out.println("✅ No existing establishment found with email: " + email);
            }
            
            // Validate phone number format if provided
            if (phoneNumber != null && !phoneNumber.trim().isEmpty()) {
                String cleanPhone = phoneNumber.trim().replaceAll("[^+0-9]", "");
                if (!cleanPhone.matches("^\\+?[0-9]{10,15}$")) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Phone number must be 10-15 digits with optional + prefix"));
                }
                phoneNumber = cleanPhone; // Use cleaned phone number
            } else {
                phoneNumber = null; // Set to null if empty to avoid database constraint issues
            }
            
            // Create establishment using EstablishmentService
            System.out.println("🏢 Creating establishment: " + name + " (" + email + ")");
            Establishment establishment = establishmentService.createEstablishmentByAdmin(
                name, type, email, address, city, state, pincode, phoneNumber, 
                operatingHours, upiId, ownerPassword
            );
            
            if (establishment != null) {
                System.out.println("✅ Establishment created successfully with ID: " + establishment.getId());
                
                // Determine password used for response
                String finalPassword = (ownerPassword != null && !ownerPassword.trim().isEmpty()) 
                    ? ownerPassword.trim() 
                    : "OpenNova@123";
                
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Establishment created successfully! Owner credentials have been sent via email.");
                response.put("establishment", establishment);
                response.put("ownerEmail", email);
                response.put("passwordSent", "Email sent to " + email + " with login credentials");
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(500).body(Map.of("error", "Failed to create establishment"));
            }
        } catch (RuntimeException e) {
            // Handle specific business logic errors
            String errorMessage = e.getMessage();
            System.err.println("❌ RuntimeException in createEstablishment: " + errorMessage);
            
            if (errorMessage.contains("already exists") || errorMessage.contains("already owns")) {
                return ResponseEntity.status(409).body(Map.of(
                    "error", errorMessage,
                    "type", "DUPLICATE_ERROR",
                    "suggestion", "Please use a different email address or check existing establishments"
                ));
            } else {
                return ResponseEntity.status(400).body(Map.of(
                    "error", errorMessage,
                    "type", "VALIDATION_ERROR"
                ));
            }
        } catch (Exception e) {
            System.err.println("❌ Unexpected error creating establishment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to create establishment: " + e.getMessage(),
                "type", "INTERNAL_ERROR",
                "suggestion", "Please check the server logs for more details"
            ));
        }
    }

    @PutMapping("/establishments/{id}/status")
    public ResponseEntity<?> updateEstablishmentStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            EstablishmentStatus establishmentStatus = EstablishmentStatus.valueOf(status.toUpperCase());
            
            Establishment updated = establishmentService.updateStatus(id, establishmentStatus);
            if (updated != null) {
                return ResponseEntity.ok(Map.of("message", "Status updated successfully", "establishment", updated));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Establishment not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update status: " + e.getMessage()));
        }
    }

    @PutMapping("/establishments/{id}/activate")
    public ResponseEntity<?> activateEstablishment(@PathVariable Long id) {
        try {
            Establishment updated = establishmentService.updateActiveStatus(id, true);
            if (updated != null) {
                return ResponseEntity.ok(Map.of("message", "Establishment activated successfully", "establishment", updated));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Establishment not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to activate establishment: " + e.getMessage()));
        }
    }

    @PutMapping("/establishments/{id}/suspend")
    public ResponseEntity<?> suspendEstablishment(@PathVariable Long id) {
        try {
            Establishment updated = establishmentService.updateActiveStatus(id, false);
            if (updated != null) {
                return ResponseEntity.ok(Map.of("message", "Establishment suspended successfully", "establishment", updated));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Establishment not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to suspend establishment: " + e.getMessage()));
        }
    }

    @DeleteMapping("/establishments/{id}")
    public ResponseEntity<?> deleteEstablishment(@PathVariable Long id) {
        try {
            boolean deleted = establishmentService.deleteEstablishmentWithCascade(id);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Establishment deleted successfully"));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Establishment not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete establishment: " + e.getMessage()));
        }
    }

    // User Management
    @RequestMapping(value = "/users/{id}/status", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> request) {
        try {
            Boolean isActive = request.get("isActive");
            User updated = userService.updateUserStatus(id, isActive);
            if (updated != null) {
                return ResponseEntity.ok(Map.of("message", "User status updated successfully", "user", updated));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update user status: " + e.getMessage()));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            boolean deleted = userService.deleteUser(id);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete user: " + e.getMessage()));
        }
    }

    // Request Management
    @RequestMapping(value = "/requests/{id}/approve", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<?> approveRequest(@PathVariable Long id) {
        try {
            System.out.println("🔄 Starting approval process for request ID: " + id);
            
            EstablishmentRequest request = establishmentRequestService.findById(id).orElse(null);
            if (request == null) {
                System.err.println("❌ Request not found with ID: " + id);
                return ResponseEntity.status(404).body(Map.of("error", "Request not found"));
            }
            
            System.out.println("✅ Found request: " + request.getName() + " (" + request.getEmail() + ")");

            // 1. Create the establishment
            Establishment establishment = new Establishment();
            establishment.setName(request.getName());
            establishment.setType(request.getType());
            establishment.setEmail(request.getEmail());
            establishment.setAddress(request.getAddress());
            establishment.setCity(request.getCity());
            establishment.setState(request.getState());
            establishment.setPincode(request.getPincode());
            establishment.setPhoneNumber(request.getPhoneNumber());
            // Validate and clean phone number
            if (establishment.getPhoneNumber() != null && !establishment.getPhoneNumber().trim().isEmpty()) {
                String cleanPhone = establishment.getPhoneNumber().trim().replaceAll("[^+0-9]", "");
                if (cleanPhone.matches("^\\+?[0-9]{10,15}$")) {
                    establishment.setPhoneNumber(cleanPhone);
                } else {
                    establishment.setPhoneNumber(null); // Set to null if invalid format
                }
            } else {
                establishment.setPhoneNumber(null); // Set to null if empty
            }
            establishment.setStatus(com.opennova.model.EstablishmentStatus.OPEN);
            establishment.setIsActive(true);

            // 2. Create owner user account (check if user already exists)
            User ownerUser = userService.findByEmailSafe(request.getEmail());
            // Use password from request, or default if not provided
            String tempPassword = (request.getPassword() != null && !request.getPassword().trim().isEmpty()) 
                ? request.getPassword().trim() 
                : "OpenNova@123";
            
            boolean usingUserPassword = (request.getPassword() != null && !request.getPassword().trim().isEmpty());
            System.out.println("🔐 Password: " + (usingUserPassword ? "Using user's custom password" : "Using default password") + " (length: " + tempPassword.length() + ")");
            
            if (ownerUser == null) {
                // Create new owner user
                ownerUser = new User();
                ownerUser.setName(request.getName() + " Owner");
                ownerUser.setEmail(request.getEmail());
                ownerUser.setPassword(passwordEncoder.encode(tempPassword));
                ownerUser.setIsActive(true);
                ownerUser.setEstablishmentType(request.getType().name());
                
                // Set role based on establishment type
                switch (request.getType()) {
                    case HOTEL:
                        ownerUser.setRole(com.opennova.model.UserRole.HOTEL_OWNER);
                        break;
                    case HOSPITAL:
                        ownerUser.setRole(com.opennova.model.UserRole.HOSPITAL_OWNER);
                        break;
                    case SHOP:
                        ownerUser.setRole(com.opennova.model.UserRole.SHOP_OWNER);
                        break;
                    default:
                        ownerUser.setRole(com.opennova.model.UserRole.OWNER);
                }
                
                // Save new user
                ownerUser = userService.save(ownerUser);
            } else {
                // Update existing user to owner role if needed
                switch (request.getType()) {
                    case HOTEL:
                        ownerUser.setRole(com.opennova.model.UserRole.HOTEL_OWNER);
                        break;
                    case HOSPITAL:
                        ownerUser.setRole(com.opennova.model.UserRole.HOSPITAL_OWNER);
                        break;
                    case SHOP:
                        ownerUser.setRole(com.opennova.model.UserRole.SHOP_OWNER);
                        break;
                    default:
                        ownerUser.setRole(com.opennova.model.UserRole.OWNER);
                }
                ownerUser.setEstablishmentType(request.getType().name());
                ownerUser.setIsActive(true);
                
                // Update password
                ownerUser.setPassword(passwordEncoder.encode(tempPassword));
                ownerUser = userService.save(ownerUser);
            }
            
            // Set owner to establishment
            establishment.setOwner(ownerUser);
            
            // Save establishment
            System.out.println("💾 Saving establishment...");
            Establishment savedEstablishment = establishmentService.save(establishment);
            System.out.println("✅ Establishment saved with ID: " + savedEstablishment.getId());

            // 3. Approve the request
            System.out.println("✅ Approving request...");
            EstablishmentRequest approved = establishmentRequestService.approveRequest(id);
            System.out.println("✅ Request approved successfully");

            // 4. Send email with credentials to the user who made the request
            try {
                // Send to the user who made the request (not the establishment email)
                String userEmail = request.getUser().getEmail();
                
                System.out.println("📧 Sending approval email to: " + userEmail + " for establishment: " + request.getName());
                System.out.println("📧 Using password: " + (request.getPassword() != null && !request.getPassword().trim().isEmpty() ? "User provided" : "Default"));
                
                emailService.sendEstablishmentApprovalWithCredentials(
                    userEmail,
                    request.getName(),
                    request.getEmail(),
                    tempPassword
                );
                System.out.println("✅ Approval email sent successfully to: " + userEmail);
            } catch (Exception emailError) {
                System.err.println("❌ Failed to send approval email: " + emailError.getMessage());
                emailError.printStackTrace();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Request approved successfully! Establishment created and owner account set up.");
            response.put("request", approved);
            response.put("establishment", savedEstablishment);
            response.put("ownerEmail", request.getEmail());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error approving request: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to approve request: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/requests/{id}/reject", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<?> rejectRequest(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String reason = request.get("reason");
            EstablishmentRequest rejected = establishmentRequestService.rejectRequest(id, reason);
            if (rejected != null) {
                return ResponseEntity.ok(Map.of("message", "Request rejected successfully", "request", rejected));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Request not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to reject request: " + e.getMessage()));
        }
    }

    @DeleteMapping("/requests/{id}")
    public ResponseEntity<?> deleteRequest(@PathVariable Long id) {
        try {
            establishmentRequestService.deleteRequest(id);
            return ResponseEntity.ok(Map.of("message", "Request deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete request: " + e.getMessage()));
        }
    }

    // Review Management
    @PutMapping("/reviews/{id}/approve")
    public ResponseEntity<?> approveReview(@PathVariable Long id) {
        try {
            Review approved = reviewService.approveReview(id);
            if (approved != null) {
                return ResponseEntity.ok(Map.of("message", "Review approved successfully", "review", approved));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Review not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to approve review: " + e.getMessage()));
        }
    }

    @PutMapping("/reviews/{id}/reject")
    public ResponseEntity<?> rejectReview(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String reason = request.get("reason");
            Review rejected = reviewService.rejectReview(id, reason);
            if (rejected != null) {
                return ResponseEntity.ok(Map.of("message", "Review rejected successfully", "review", rejected));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Review not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to reject review: " + e.getMessage()));
        }
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        try {
            boolean deleted = reviewService.deleteReview(id);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Review deleted successfully"));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Review not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete review: " + e.getMessage()));
        }
    }
}