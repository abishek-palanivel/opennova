package com.opennova.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.opennova.service.RealTimeUpdateService;
import com.opennova.service.EstablishmentService;
import com.opennova.service.MenuService;
import com.opennova.service.DoctorService;
import com.opennova.service.CollectionService;
import com.opennova.service.SharedStateService;
import com.opennova.service.AuthService;
import com.opennova.model.Establishment;
import com.opennova.model.Menu;
import com.opennova.repository.EstablishmentRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.Optional;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002", "http://127.0.0.1:3002", "http://localhost:3003", "http://127.0.0.1:3003"}, maxAge = 3600)
public class PublicController {
    
    @Autowired
    private RealTimeUpdateService realTimeUpdateService;
    
    @Autowired
    private EstablishmentService establishmentService;

    @Autowired
    private AuthService authService;
    
    @Autowired
    private MenuService menuService;
    
    @Autowired
    private com.opennova.service.DoctorService doctorService;
    
    @Autowired
    private com.opennova.service.CollectionService collectionService;
    
    @Autowired
    private com.opennova.service.SharedStateService sharedStateService;
    
    @Autowired
    private com.opennova.service.UserService userService;
    
    @Autowired
    private com.opennova.service.BookingService bookingService;
    
    @Autowired
    private com.opennova.service.QRCodeService qrCodeService;

    @Autowired
    private EstablishmentRepository establishmentRepository;
    
    @Autowired
    private com.opennova.service.ReviewService reviewService;

    /**
     * Serve uploaded images publicly
     */
    @GetMapping("/uploads/{folder}/{filename:.+}")
    public ResponseEntity<org.springframework.core.io.Resource> serveFile(
            @PathVariable String folder, 
            @PathVariable String filename) {
        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get("uploads", folder, filename);
            org.springframework.core.io.Resource resource = new org.springframework.core.io.FileSystemResource(filePath);
            
            if (resource.exists() && resource.isReadable()) {
                String contentType = java.nio.file.Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                
                return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header("Cache-Control", "max-age=3600")
                    .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error serving file: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        try {
            Map<String, Object> health = new HashMap<>();
            health.put("status", "UP");
            health.put("timestamp", java.time.LocalDateTime.now());
            
            // Test database connection
            try {
                long userCount = userService.getTotalUsers();
                long establishmentCount = establishmentService.getTotalEstablishments();
                health.put("database", "CONNECTED");
                health.put("userCount", userCount);
                health.put("establishmentCount", establishmentCount);
            } catch (Exception e) {
                health.put("database", "ERROR: " + e.getMessage());
            }
            
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            Map<String, Object> health = new HashMap<>();
            health.put("status", "DOWN");
            health.put("error", e.getMessage());
            health.put("timestamp", java.time.LocalDateTime.now());
            return ResponseEntity.status(500).body(health);
        }
    }

    // Public test endpoint for debugging analytics (no authentication required)
    @GetMapping("/admin-stats")
    public ResponseEntity<?> getPublicAdminStats() {
        try {
            System.out.println("📊 PublicController: Providing public admin stats for debugging...");
            Map<String, Object> stats = new HashMap<>();
            
            // Get real data without authentication
            stats.put("totalUsers", userService.getTotalUsers());
            stats.put("totalEstablishments", establishmentService.getTotalEstablishments());
            stats.put("totalBookings", bookingService.getTotalBookings());
            stats.put("totalReviews", reviewService.getTotalReviews());
            stats.put("totalRevenue", bookingService.getTotalRevenue());
            stats.put("monthlyRevenue", bookingService.getMonthlyRevenue());
            stats.put("activeEstablishments", establishmentService.getActiveEstablishments());
            stats.put("confirmedBookings", bookingService.getConfirmedBookingsCount());
            stats.put("pendingBookings", bookingService.getPendingBookingsCount());
            
            System.out.println("📊 PublicController: Public admin stats provided: " + stats);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.err.println("❌ PublicController: Failed to fetch public admin stats: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch admin stats: " + e.getMessage()));
        }
    }

    @GetMapping("/establishments/live")
    public ResponseEntity<?> getLiveEstablishments() {
        try {
            List<Map<String, Object>> establishments = new ArrayList<>();
            
            // Get real establishments from database
            try {
                List<Establishment> dbEstablishments = establishmentService.findAll();
                
                if (dbEstablishments != null && !dbEstablishments.isEmpty()) {
                    System.out.println("✅ Found " + dbEstablishments.size() + " live establishments in database");
                    
                    for (Establishment est : dbEstablishments) {
                        if (est.getIsActive() != null && est.getIsActive()) {
                            Map<String, Object> estData = new HashMap<>();
                            estData.put("id", est.getId());
                            estData.put("name", est.getName());
                            estData.put("type", est.getType() != null ? est.getType().toString() : "UNKNOWN");
                            estData.put("address", est.getAddress());
                            estData.put("contactNumber", est.getPhoneNumber());
                            estData.put("operatingHours", est.getOperatingHours());
                            estData.put("upiId", est.getUpiId());
                            estData.put("email", est.getEmail());
                            estData.put("latitude", est.getLatitude());
                            estData.put("longitude", est.getLongitude());
                            
                            // Get real-time status
                            try {
                                String realTimeStatus = realTimeUpdateService.getEstablishmentStatus(est.getId());
                                if (realTimeStatus != null && !realTimeStatus.equals("ERROR") && !realTimeStatus.equals("UNKNOWN")) {
                                    estData.put("status", realTimeStatus);
                                } else {
                                    estData.put("status", est.getStatus() != null ? est.getStatus().toString() : "OPEN");
                                }
                            } catch (Exception e) {
                                estData.put("status", est.getStatus() != null ? est.getStatus().toString() : "OPEN");
                            }
                            
                            // Calculate real ratings
                            try {
                                estData.put("averageRating", establishmentService.calculateAverageRating(est.getId()));
                                estData.put("reviewCount", establishmentService.getTotalReviews(est.getId()));
                            } catch (Exception e) {
                                estData.put("averageRating", 0.0);
                                estData.put("reviewCount", 0);
                            }
                            
                            establishments.add(estData);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to fetch live establishments from database: " + e.getMessage());
            }
            
            return ResponseEntity.ok(establishments);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to fetch live establishments: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/establishments")
    public ResponseEntity<?> getPublicEstablishments(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String status) {
        try {
            List<Map<String, Object>> establishments = new ArrayList<>();
            
            // Try to get real establishments from database first
            try {
                List<Establishment> dbEstablishments = establishmentService.findAll();
                
                if (dbEstablishments != null && !dbEstablishments.isEmpty()) {
                    System.out.println("✅ Found " + dbEstablishments.size() + " establishments in database");
                    
                    for (Establishment est : dbEstablishments) {
                        try {
                            if (est.getIsActive() != null && est.getIsActive()) { // Only include active establishments
                                System.out.println("📝 Processing establishment: " + est.getName() + " (ID: " + est.getId() + ")");
                                System.out.println("   - Operating Hours: " + est.getOperatingHours());
                                System.out.println("   - Status: " + est.getStatus());
                                System.out.println("   - Address: " + est.getAddress());
                                Map<String, Object> estData = new HashMap<>();
                                estData.put("id", est.getId());
                                estData.put("name", est.getName());
                                estData.put("type", est.getType() != null ? est.getType().toString() : "UNKNOWN");
                                estData.put("address", est.getAddress());
                                estData.put("contactNumber", est.getPhoneNumber());
                                estData.put("operatingHours", est.getOperatingHours());
                                estData.put("status", est.getStatus() != null ? est.getStatus().toString() : "OPEN");
                                estData.put("email", est.getEmail());
                                estData.put("latitude", est.getLatitude());
                                estData.put("longitude", est.getLongitude());
                                estData.put("upiId", est.getUpiId());
                                estData.put("profileImagePath", est.getProfileImagePath());
                                estData.put("weeklySchedule", est.getWeeklySchedule());
                                
                                // Get real-time status if available (with error handling)
                                try {
                                    String realTimeStatus = realTimeUpdateService.getEstablishmentStatus(est.getId());
                                    if (realTimeStatus != null && !realTimeStatus.equals("ERROR") && !realTimeStatus.equals("UNKNOWN")) {
                                        estData.put("status", realTimeStatus);
                                    }
                                } catch (Exception e) {
                                    System.err.println("Failed to get real-time status for establishment " + est.getId() + ": " + e.getMessage());
                                }
                                
                                // Calculate average rating and review count (with error handling)
                                try {
                                    estData.put("averageRating", establishmentService.calculateAverageRating(est.getId()));
                                    estData.put("reviewCount", establishmentService.getTotalReviews(est.getId()));
                                } catch (Exception e) {
                                    System.err.println("Failed to calculate ratings for establishment " + est.getId() + ": " + e.getMessage());
                                    estData.put("averageRating", 0.0);
                                    estData.put("reviewCount", 0);
                                }
                                
                                establishments.add(estData);
                                System.out.println("✅ Added establishment to response: " + est.getName());
                            }
                        } catch (Exception e) {
                            System.err.println("Error processing establishment " + est.getId() + ": " + e.getMessage());
                            // Continue with next establishment
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to fetch establishments from database: " + e.getMessage());
                e.printStackTrace();
            }
            
            // Log if no establishments found
            if (establishments.isEmpty()) {
                System.out.println("⚠️ No establishments found in database. Run database migration 16_seed_demo_establishments.sql to add demo data.");
            }
            
            // Apply filters
            if (type != null && !type.isEmpty()) {
                establishments = establishments.stream()
                    .filter(est -> type.equals(est.get("type")))
                    .collect(java.util.stream.Collectors.toList());
            }
            
            if (status != null && !status.isEmpty()) {
                establishments = establishments.stream()
                    .filter(est -> status.equals(est.get("status")))
                    .collect(java.util.stream.Collectors.toList());
            }
            
            System.out.println("Returning " + establishments.size() + " establishments to user portal");
            
            // Debug: Log each establishment type
            for (Map<String, Object> est : establishments) {
                System.out.println("  - " + est.get("name") + " (Type: " + est.get("type") + ")");
                if ("HOSPITAL".equals(est.get("type"))) {
                    Object doctors = est.get("doctors");
                    if (doctors instanceof List) {
                        System.out.println("    Hospital has " + ((List<?>) doctors).size() + " doctors");
                    }
                }
            }
            
            return ResponseEntity.ok(establishments);
        } catch (Exception e) {
            System.err.println("Failed to fetch establishments: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to fetch establishments: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/establishments/{id}")
    public ResponseEntity<?> getEstablishmentDetails(@PathVariable Long id) {
        try {
            System.out.println("🔍 Fetching establishment details for ID: " + id);
            
            // Get actual establishment from database - always fresh data
            Establishment establishment = establishmentService.findById(id);
            if (establishment == null) {
                System.err.println("❌ Establishment not found with ID: " + id);
                Map<String, String> error = new HashMap<>();
                error.put("message", "Establishment not found");
                return ResponseEntity.notFound().build();
            }
            
            System.out.println("✅ Found establishment: " + establishment.getName() + " (Type: " + establishment.getType() + ")");
            System.out.println("📝 Operating Hours: " + establishment.getOperatingHours());
            System.out.println("📅 Weekly Schedule: " + (establishment.getWeeklySchedule() != null ? "Present" : "Not set"));
            
            // Build establishment response with fresh database data
            Map<String, Object> establishmentData = new HashMap<>();
            establishmentData.put("id", establishment.getId());
            establishmentData.put("name", establishment.getName());
            establishmentData.put("type", establishment.getType().toString());
            establishmentData.put("address", establishment.getAddress());
            establishmentData.put("contactNumber", establishment.getPhoneNumber());
            establishmentData.put("operatingHours", establishment.getOperatingHours());
            establishmentData.put("weeklySchedule", establishment.getWeeklySchedule());
            establishmentData.put("status", establishment.getStatus().toString());
            establishmentData.put("upiId", establishment.getUpiId());
            establishmentData.put("email", establishment.getEmail());
            establishmentData.put("latitude", establishment.getLatitude());
            establishmentData.put("longitude", establishment.getLongitude());
            establishmentData.put("profileImagePath", establishment.getProfileImagePath());
            
            // Get menu items for this establishment
            System.out.println("🍽️ Fetching menus for establishment: " + establishment.getName() + " (ID: " + establishment.getId() + ")");
            List<Menu> menus = menuService.getMenusByEstablishmentId(establishment.getId());
            List<Map<String, Object>> menuItems = new ArrayList<>();
            
            System.out.println("📝 Processing " + menus.size() + " menus for user portal");
                for (Menu menu : menus) {
                // Only include active and available menus
                if (menu.getIsActive() && menu.getIsAvailable()) {
                    Map<String, Object> menuItem = new HashMap<>();
                    menuItem.put("id", menu.getId());
                    menuItem.put("name", menu.getName());
                    menuItem.put("description", menu.getDescription());
                    menuItem.put("price", menu.getPrice());
                    menuItem.put("isAvailable", menu.getIsAvailable());
                    menuItem.put("available", menu.getIsAvailable()); // Add for frontend compatibility
                    menuItem.put("availabilityTime", menu.getAvailabilityTime());
                    menuItem.put("category", menu.getCategory());
                    menuItem.put("preparationTime", menu.getPreparationTime());
                    menuItem.put("isVegetarian", menu.getIsVegetarian());
                    menuItem.put("isSpecial", menu.getIsSpecial());
                    
                    // Fix image URL for user portal
                    String imagePath = menu.getImagePath();
                    if (imagePath != null && !imagePath.trim().isEmpty()) {
                        String imageUrl = "http://localhost:8080/api/images/" + imagePath;
                        menuItem.put("imagePath", imageUrl);
                    } else {
                        menuItem.put("imagePath", null);
                    }
                    
                    // Add default availability schedule
                    Map<String, Object> schedule = new HashMap<>();
                    schedule.put("monday", Map.of("isAvailable", true, "startTime", "09:00", "endTime", "21:00"));
                    schedule.put("tuesday", Map.of("isAvailable", true, "startTime", "09:00", "endTime", "21:00"));
                    schedule.put("wednesday", Map.of("isAvailable", true, "startTime", "09:00", "endTime", "21:00"));
                    schedule.put("thursday", Map.of("isAvailable", true, "startTime", "09:00", "endTime", "21:00"));
                    schedule.put("friday", Map.of("isAvailable", true, "startTime", "09:00", "endTime", "21:00"));
                    schedule.put("saturday", Map.of("isAvailable", true, "startTime", "09:00", "endTime", "21:00"));
                    schedule.put("sunday", Map.of("isAvailable", true, "startTime", "10:00", "endTime", "20:00"));
                    menuItem.put("availabilitySchedule", schedule);
                    
                    menuItems.add(menuItem);
                    System.out.println("  ✅ Added menu item: " + menu.getName() + " - ₹" + menu.getPrice() + " (Available: " + menu.getIsAvailable() + ")");
                } else {
                    System.out.println("  ⏭️ Skipped menu item: " + menu.getName() + " (Active: " + menu.getIsActive() + ", Available: " + menu.getIsAvailable() + ")");
                }
            }
            
            establishmentData.put("menuItems", menuItems);
            System.out.println("🍽️ Added " + menuItems.size() + " menu items to establishment data");
            
            // Get doctors for hospitals
            if (establishment.getType().toString().equals("HOSPITAL")) {
                System.out.println("👨‍⚕️ Fetching doctors for hospital: " + establishment.getName());
                List<com.opennova.model.Doctor> doctors = doctorService.getDoctorsByEstablishmentId(establishment.getId());
                List<Map<String, Object>> doctorItems = new ArrayList<>();
                
                System.out.println("📝 Found " + doctors.size() + " doctors for hospital");
                for (com.opennova.model.Doctor doctor : doctors) {
                    // Only include active and available doctors
                    if (doctor.getIsActive() && doctor.getIsAvailable()) {
                        Map<String, Object> doctorItem = new HashMap<>();
                        doctorItem.put("id", doctor.getId());
                        doctorItem.put("name", doctor.getName());
                        doctorItem.put("specialization", doctor.getSpecialization());
                        doctorItem.put("consultationFee", doctor.getPrice()); // Use consultationFee for frontend compatibility
                        doctorItem.put("price", doctor.getPrice()); // Keep price for backward compatibility
                        doctorItem.put("availabilityTime", doctor.getAvailabilityTime());
                        doctorItem.put("available", doctor.getIsAvailable()); // Add for frontend compatibility
                        doctorItem.put("isAvailable", doctor.getIsAvailable()); // Keep for consistency
                        
                        // Fix image URL for user portal
                        String imagePath = doctor.getImagePath();
                        if (imagePath != null && !imagePath.trim().isEmpty()) {
                            String imageUrl = "http://localhost:8080/api/images/" + imagePath;
                            doctorItem.put("imagePath", imageUrl);
                        } else {
                            doctorItem.put("imagePath", null);
                        }
                        
                        doctorItems.add(doctorItem);
                        System.out.println("  ✅ Added doctor: " + doctor.getName() + " - ₹" + doctor.getPrice());
                    } else {
                        System.out.println("  ⏭️ Skipped doctor: " + doctor.getName() + " (Active: " + doctor.getIsActive() + ", Available: " + doctor.getIsAvailable() + ")");
                    }
                }
                establishmentData.put("doctors", doctorItems);
                System.out.println("👨‍⚕️ Added " + doctorItems.size() + " doctors to hospital data");
            }
            
            // Get collections for shops
            if (establishment.getType().toString().equals("SHOP")) {
                List<com.opennova.model.Collection> collections = collectionService.getCollectionsByEstablishmentId(establishment.getId());
                List<Map<String, Object>> collectionItems = new ArrayList<>();
                
                for (com.opennova.model.Collection collection : collections) {
                    // Only include active and available collections
                    if (collection.getIsActive() && collection.getIsAvailable()) {
                        Map<String, Object> collectionItem = new HashMap<>();
                        collectionItem.put("id", collection.getId());
                        collectionItem.put("itemName", collection.getItemName());
                        collectionItem.put("description", collection.getDescription());
                        collectionItem.put("price", collection.getPrice());
                        collectionItem.put("sizes", collection.getSizes());
                        collectionItem.put("color", collection.getColors());
                        collectionItem.put("fabric", collection.getFabric());
                        collectionItem.put("brand", collection.getBrand());
                        collectionItem.put("stock", collection.getStock());
                        collectionItem.put("isSpecialOffer", collection.getIsSpecialOffer());
                        collectionItem.put("available", collection.getIsAvailable()); // Add for frontend compatibility
                        collectionItem.put("isAvailable", collection.getIsAvailable()); // Keep for consistency
                        
                        // Fix image URL for user portal
                        String imagePath = collection.getImagePath();
                        if (imagePath != null && !imagePath.trim().isEmpty()) {
                            String imageUrl = "http://localhost:8080/api/images/" + imagePath;
                            collectionItem.put("imagePath", imageUrl);
                        } else {
                            collectionItem.put("imagePath", null);
                        }
                        
                        collectionItems.add(collectionItem);
                    }
                }
                establishmentData.put("collections", collectionItems);
            }
            
            return ResponseEntity.ok(establishmentData);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to fetch establishment details: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/establishments/{id}/status")
    public ResponseEntity<?> getEstablishmentStatus(@PathVariable Long id) {
        try {
            // Get real-time status
            String status = realTimeUpdateService.getEstablishmentStatus(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("establishmentId", id);
            response.put("status", status);
            response.put("timestamp", java.time.LocalDateTime.now());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to fetch establishment status");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Emergency unlock and reset endpoints removed - account locking feature has been disabled


    /**
     * Get establishment menus (public access)
     */
    @GetMapping("/establishments/{id}/menus")
    public ResponseEntity<?> getEstablishmentMenus(@PathVariable Long id) {
        try {
            System.out.println("🍽️ Getting menus for establishment ID: " + id);
            
            Optional<Establishment> establishment = establishmentRepository.findById(id);
            if (!establishment.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Establishment not found");
                return ResponseEntity.status(404).body(error);
            }
            
            Establishment est = establishment.get();
            
            // Get active menus for this establishment
            List<Menu> menus = menuService.getMenusByEstablishmentId(id);
            List<Map<String, Object>> menuList = new ArrayList<>();
            
            for (Menu menu : menus) {
                Map<String, Object> menuData = new HashMap<>();
                menuData.put("id", menu.getId());
                menuData.put("name", menu.getName());
                menuData.put("description", menu.getDescription());
                menuData.put("price", menu.getPrice());
                menuData.put("isAvailable", menu.getIsAvailable());
                menuData.put("category", menu.getCategory());
                menuData.put("availabilityTime", menu.getAvailabilityTime());
                menuData.put("preparationTime", menu.getPreparationTime());
                menuData.put("isVegetarian", menu.getIsVegetarian());
                menuData.put("isSpecial", menu.getIsSpecial());
                
                // Fix image URL to be accessible from frontend
                String imagePath = menu.getImagePath();
                if (imagePath != null && !imagePath.trim().isEmpty()) {
                    String imageUrl = "http://localhost:8080/api/images/" + imagePath;
                    menuData.put("imagePath", imageUrl);
                    menuData.put("imageUrl", imageUrl);
                } else {
                    menuData.put("imagePath", null);
                    menuData.put("imageUrl", null);
                }
                
                menuList.add(menuData);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("establishmentId", id);
            response.put("establishmentName", est.getName());
            response.put("menus", menuList);
            response.put("totalMenus", menuList.size());
            
            System.out.println("✅ Found " + menuList.size() + " menus for: " + est.getName());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Failed to get establishment menus: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get establishment menus: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * QR Code Verification Endpoint - Public access for scanned QR codes
     */
    @GetMapping("/verify")
    public ResponseEntity<?> verifyBookingQR(
            @RequestParam Long booking,
            @RequestParam Long establishment,
            @RequestParam String customer,
            @RequestParam String date,
            @RequestParam String time,
            @RequestParam Double amount,
            @RequestParam String status,
            @RequestParam String ref) {
        try {
            System.out.println("🔍 QR Code verification request:");
            System.out.println("   - Booking ID: " + booking);
            System.out.println("   - Establishment ID: " + establishment);
            System.out.println("   - Customer: " + customer);
            System.out.println("   - Reference: " + ref);
            
            // Verify the booking exists and matches the QR data
            com.opennova.model.Booking bookingEntity = bookingService.getBookingById(booking);
            if (bookingEntity == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("valid", false);
                response.put("message", "Booking not found");
                response.put("timestamp", java.time.LocalDateTime.now());
                return ResponseEntity.ok(response);
            }
            
            // Verify establishment matches
            if (!bookingEntity.getEstablishment().getId().equals(establishment)) {
                Map<String, Object> response = new HashMap<>();
                response.put("valid", false);
                response.put("message", "Establishment mismatch");
                response.put("timestamp", java.time.LocalDateTime.now());
                return ResponseEntity.ok(response);
            }
            
            // Verify transaction reference matches
            if (!ref.equals(bookingEntity.getTransactionId())) {
                Map<String, Object> response = new HashMap<>();
                response.put("valid", false);
                response.put("message", "Transaction reference mismatch");
                response.put("timestamp", java.time.LocalDateTime.now());
                return ResponseEntity.ok(response);
            }
            
            // Create verification response with booking details
            Map<String, Object> response = new HashMap<>();
            response.put("valid", true);
            response.put("message", "Booking verified successfully");
            response.put("timestamp", java.time.LocalDateTime.now());
            
            // Add booking details for display
            Map<String, Object> bookingDetails = new HashMap<>();
            bookingDetails.put("bookingId", bookingEntity.getId());
            bookingDetails.put("customerName", bookingEntity.getUser() != null ? bookingEntity.getUser().getName() : "Guest");
            bookingDetails.put("customerEmail", bookingEntity.getUserEmail());
            bookingDetails.put("establishmentName", bookingEntity.getEstablishment().getName());
            bookingDetails.put("establishmentType", bookingEntity.getEstablishment().getType().toString());
            bookingDetails.put("visitingDate", bookingEntity.getVisitingDate());
            bookingDetails.put("visitingTime", bookingEntity.getVisitingTime());
            bookingDetails.put("totalAmount", bookingEntity.getAmount() != null ? bookingEntity.getAmount().doubleValue() : 0.0);
            bookingDetails.put("paidAmount", bookingEntity.getPaymentAmount() != null ? bookingEntity.getPaymentAmount().doubleValue() : 0.0);
            bookingDetails.put("status", bookingEntity.getStatus().toString());
            bookingDetails.put("transactionId", bookingEntity.getTransactionId());
            bookingDetails.put("createdAt", bookingEntity.getCreatedAt());
            
            response.put("booking", bookingDetails);
            
            System.out.println("✅ QR Code verified successfully for booking: " + booking);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ QR verification error: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> response = new HashMap<>();
            response.put("valid", false);
            response.put("message", "Verification failed: " + e.getMessage());
            response.put("timestamp", java.time.LocalDateTime.now());
            return ResponseEntity.ok(response);
        }
    }


}
