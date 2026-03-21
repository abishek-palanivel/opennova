package com.opennova.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.opennova.model.*;
import com.opennova.repository.EstablishmentRepository;
import com.opennova.repository.UserRepository;

import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@Service
public class EstablishmentService {

    @Autowired
    private EstablishmentRepository establishmentRepository;

    @Autowired
    private EmailService emailService;
    
    @Autowired
    private RealTimeUpdateService realTimeUpdateService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private ReviewService reviewService;

    // Establishment Management
    public Establishment findByEmail(String email) {
        Optional<Establishment> establishment = establishmentRepository.findByEmail(email);
        return establishment.orElse(null);
    }

    public Establishment findByOwnerEmail(String ownerEmail) {
        try {
            // Find establishments where the owner's email matches
            List<Establishment> establishments = establishmentRepository.findAll();
            for (Establishment est : establishments) {
                if (est.getOwner() != null && ownerEmail.equals(est.getOwner().getEmail())) {
                    return est;
                }
            }
            return null;
        } catch (Exception e) {
            System.err.println("Error finding establishment by owner email: " + e.getMessage());
            return null;
        }
    }

    public Establishment findById(Long id) {
        Optional<Establishment> establishment = establishmentRepository.findById(id);
        return establishment.orElse(null);
    }

    @Transactional
    public Establishment assignEstablishmentToUser(User user) {
        System.out.println("🔄 Assigning establishment to user: " + user.getEmail() + " (Role: " + user.getRole() + ")");
        
        // Check if user already has an establishment assigned
        List<Establishment> userEstablishments = establishmentRepository.findByOwner(user);
        if (!userEstablishments.isEmpty()) {
            System.out.println("✅ User already has establishment assigned: " + userEstablishments.get(0).getName());
            return userEstablishments.get(0);
        }
        
        // Find an unassigned establishment that matches the user's role
        List<Establishment> allEstablishments = establishmentRepository.findAll();
        
        for (Establishment est : allEstablishments) {
            // Skip if establishment already has an owner
            if (est.getOwner() != null) {
                continue;
            }
            
            // Match establishment type with user role
            boolean matches = false;
            if (user.getRole() == com.opennova.model.UserRole.HOSPITAL_OWNER && 
                est.getType() == com.opennova.model.EstablishmentType.HOSPITAL) {
                matches = true;
            } else if (user.getRole() == com.opennova.model.UserRole.SHOP_OWNER && 
                est.getType() == com.opennova.model.EstablishmentType.SHOP) {
                matches = true;
            } else if (user.getRole() == com.opennova.model.UserRole.HOTEL_OWNER && 
                est.getType() == com.opennova.model.EstablishmentType.HOTEL) {
                matches = true;
            }
            
            if (matches) {
                // Assign this establishment to the user
                est.setOwner(user);
                est.setUpdatedAt(LocalDateTime.now());
                Establishment savedEstablishment = establishmentRepository.save(est);
                System.out.println("✅ Assigned establishment '" + est.getName() + "' to user '" + user.getEmail() + "'");
                return savedEstablishment;
            }
        }
        
        System.out.println("❌ No available establishment found for user role: " + user.getRole());
        return null;
    }

    public Establishment findByOwner(User owner) {
        System.out.println("🔍 Finding establishment for user: " + owner.getEmail() + " (Role: " + owner.getRole() + ")");
        
        // First, try to find establishments properly owned by this user
        List<Establishment> establishments = establishmentRepository.findByOwner(owner);
        
        if (!establishments.isEmpty()) {
            System.out.println("✅ Found " + establishments.size() + " establishments owned by user");
            return establishments.get(0);
        }
        
        // If no establishment is assigned, try to assign one automatically
        System.out.println("⚠️ No establishments found for user, attempting auto-assignment...");
        Establishment assigned = assignEstablishmentToUser(owner);
        
        if (assigned != null) {
            System.out.println("✅ Auto-assigned establishment: " + assigned.getName());
            return assigned;
        }
        
        System.out.println("❌ No establishment could be assigned to user");
        return null;
    }
    public List<Establishment> findByOwnerId(Long ownerId) {
        return establishmentRepository.findByOwnerId(ownerId);
    }


    public List<Establishment> findAll() {
        // Return all establishments for debugging - we'll filter in the controller
        return establishmentRepository.findAll();
    }

    public List<Establishment> findAllForAdmin() {
        // Return all establishments for admin purposes
        return establishmentRepository.findAll();
    }

    public List<Establishment> findByType(EstablishmentType type) {
        return establishmentRepository.findByType(type);
    }

    public List<Establishment> findByStatus(EstablishmentStatus status) {
        return establishmentRepository.findByStatus(status);
    }

    @Transactional
    public Establishment save(Establishment establishment) {
        try {
            establishment.setUpdatedAt(LocalDateTime.now());
            Establishment saved = establishmentRepository.save(establishment);
            System.out.println("✅ EstablishmentService: Successfully saved establishment " + saved.getId());
            return saved;
        } catch (Exception e) {
            System.err.println("❌ EstablishmentService: Failed to save establishment: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public Establishment updateEstablishment(Long id, Establishment updatedEstablishment) {
        Optional<Establishment> existingEstablishment = establishmentRepository.findById(id);
        if (existingEstablishment.isPresent()) {
            Establishment establishment = existingEstablishment.get();
            
            if (updatedEstablishment.getName() != null) {
                establishment.setName(updatedEstablishment.getName());
            }
            if (updatedEstablishment.getAddress() != null) {
                establishment.setAddress(updatedEstablishment.getAddress());
            }
            if (updatedEstablishment.getPhoneNumber() != null) {
                establishment.setPhoneNumber(validateAndCleanPhoneNumber(updatedEstablishment.getPhoneNumber()));
            }
            if (updatedEstablishment.getStatus() != null) {
                establishment.setStatus(updatedEstablishment.getStatus());
            }
            if (updatedEstablishment.getUpiId() != null) {
                establishment.setUpiId(updatedEstablishment.getUpiId());
            }
            if (updatedEstablishment.getOperatingHours() != null) {
                establishment.setOperatingHours(updatedEstablishment.getOperatingHours());
            }
            if (updatedEstablishment.getLatitude() != null) {
                establishment.setLatitude(updatedEstablishment.getLatitude());
            }
            if (updatedEstablishment.getLongitude() != null) {
                establishment.setLongitude(updatedEstablishment.getLongitude());
            }
            
            establishment.setUpdatedAt(LocalDateTime.now());
            return establishmentRepository.save(establishment);
        }
        return null;
    }

    public Establishment updateEstablishmentWithImage(Long id, Establishment updatedEstablishment, MultipartFile profileImage) {
        Optional<Establishment> existingEstablishment = establishmentRepository.findById(id);
        if (existingEstablishment.isPresent()) {
            Establishment establishment = existingEstablishment.get();
            
            System.out.println("🔍 Updating establishment ID: " + id);
            System.out.println("🔍 Current password field: " + (establishment.getPassword() != null ? "Present" : "NULL"));
            System.out.println("🔍 Current email: " + establishment.getEmail());
            
            // Ensure password is preserved (never update password through profile updates)
            String originalPassword = establishment.getPassword();
            if (originalPassword == null || originalPassword.trim().isEmpty()) {
                // If password is null/empty, set a default value to satisfy @NotBlank constraint
                establishment.setPassword("default_password_placeholder");
            }
            
            // Update basic fields
            if (updatedEstablishment.getName() != null) {
                establishment.setName(updatedEstablishment.getName());
            }
            if (updatedEstablishment.getAddress() != null) {
                establishment.setAddress(updatedEstablishment.getAddress());
            }
            if (updatedEstablishment.getPhoneNumber() != null) {
                establishment.setPhoneNumber(updatedEstablishment.getPhoneNumber());
            }
            if (updatedEstablishment.getStatus() != null) {
                establishment.setStatus(updatedEstablishment.getStatus());
            }
            if (updatedEstablishment.getUpiId() != null) {
                establishment.setUpiId(updatedEstablishment.getUpiId());
            }
            if (updatedEstablishment.getOperatingHours() != null) {
                establishment.setOperatingHours(updatedEstablishment.getOperatingHours());
            }
            if (updatedEstablishment.getWeeklySchedule() != null) {
                establishment.setWeeklySchedule(updatedEstablishment.getWeeklySchedule());
            }
            if (updatedEstablishment.getLatitude() != null) {
                establishment.setLatitude(updatedEstablishment.getLatitude());
            }
            if (updatedEstablishment.getLongitude() != null) {
                establishment.setLongitude(updatedEstablishment.getLongitude());
            }

            // Handle profile image upload
            if (profileImage != null && !profileImage.isEmpty()) {
                try {
                    // Delete old image if exists
                    if (establishment.getProfileImagePath() != null) {
                        try {
                            fileStorageService.deleteFile(establishment.getProfileImagePath());
                        } catch (Exception e) {
                            System.err.println("Failed to delete old profile image: " + e.getMessage());
                        }
                    }
                    
                    String imagePath = fileStorageService.storeFile(profileImage, "profile-images");
                    establishment.setProfileImagePath(imagePath);
                } catch (Exception e) {
                    System.err.println("Failed to store profile image: " + e.getMessage());
                    // Continue without updating image
                }
            }
            
            establishment.setUpdatedAt(LocalDateTime.now());
            
            // Final validation before save
            System.out.println("🔍 Before save - Password field: " + (establishment.getPassword() != null ? "Present" : "NULL"));
            System.out.println("🔍 Before save - Email field: " + establishment.getEmail());
            System.out.println("🔍 Before save - Name field: " + establishment.getName());
            
            // Notify real-time updates for status changes
            if (updatedEstablishment.getStatus() != null) {
                realTimeUpdateService.notifyEstablishmentStatusUpdate(establishment);
            }
            
            return establishmentRepository.save(establishment);
        }
        return null;
    }

    public Establishment updateEstablishmentWithImages(Long id, Establishment updatedEstablishment, 
                                                     MultipartFile profileImage, MultipartFile upiQrCode) {
        Optional<Establishment> existingEstablishment = establishmentRepository.findById(id);
        if (existingEstablishment.isPresent()) {
            Establishment establishment = existingEstablishment.get();
            
            System.out.println("🔍 Updating establishment ID: " + id + " with images");
            
            // Ensure password is preserved (never update password through profile updates)
            String originalPassword = establishment.getPassword();
            if (originalPassword == null || originalPassword.trim().isEmpty()) {
                establishment.setPassword("default_password_placeholder");
            }
            
            // Update basic fields
            if (updatedEstablishment.getName() != null) {
                establishment.setName(updatedEstablishment.getName());
            }
            if (updatedEstablishment.getAddress() != null) {
                establishment.setAddress(updatedEstablishment.getAddress());
            }
            if (updatedEstablishment.getPhoneNumber() != null) {
                establishment.setPhoneNumber(updatedEstablishment.getPhoneNumber());
            }
            if (updatedEstablishment.getStatus() != null) {
                establishment.setStatus(updatedEstablishment.getStatus());
            }
            if (updatedEstablishment.getUpiId() != null) {
                establishment.setUpiId(updatedEstablishment.getUpiId());
            }
            if (updatedEstablishment.getOperatingHours() != null) {
                establishment.setOperatingHours(updatedEstablishment.getOperatingHours());
            }
            if (updatedEstablishment.getWeeklySchedule() != null) {
                establishment.setWeeklySchedule(updatedEstablishment.getWeeklySchedule());
            }
            if (updatedEstablishment.getLatitude() != null) {
                establishment.setLatitude(updatedEstablishment.getLatitude());
            }
            if (updatedEstablishment.getLongitude() != null) {
                establishment.setLongitude(updatedEstablishment.getLongitude());
            }

            // Handle profile image upload
            if (profileImage != null && !profileImage.isEmpty()) {
                try {
                    // Delete old image if exists
                    if (establishment.getProfileImagePath() != null) {
                        try {
                            fileStorageService.deleteFile(establishment.getProfileImagePath());
                        } catch (Exception e) {
                            System.err.println("Failed to delete old profile image: " + e.getMessage());
                        }
                    }
                    
                    String imagePath = fileStorageService.storeFile(profileImage, "profile-images");
                    establishment.setProfileImagePath(imagePath);
                    System.out.println("✅ Updated profile image: " + imagePath);
                } catch (Exception e) {
                    System.err.println("Failed to store profile image: " + e.getMessage());
                }
            }

            // Handle UPI QR code upload
            if (upiQrCode != null && !upiQrCode.isEmpty()) {
                try {
                    // Delete old QR code if exists
                    if (establishment.getUpiQrCodePath() != null) {
                        try {
                            fileStorageService.deleteFile(establishment.getUpiQrCodePath());
                        } catch (Exception e) {
                            System.err.println("Failed to delete old UPI QR code: " + e.getMessage());
                        }
                    }
                    
                    String qrCodePath = fileStorageService.storeFile(upiQrCode, "upi-qr-codes");
                    establishment.setUpiQrCodePath(qrCodePath);
                    System.out.println("✅ Updated UPI QR code: " + qrCodePath);
                } catch (Exception e) {
                    System.err.println("Failed to store UPI QR code: " + e.getMessage());
                }
            }
            
            establishment.setUpdatedAt(LocalDateTime.now());
            
            // Notify real-time updates for status changes
            if (updatedEstablishment.getStatus() != null) {
                realTimeUpdateService.notifyEstablishmentStatusUpdate(establishment);
            }
            
            return establishmentRepository.save(establishment);
        }
        return null;
    }

    public void deleteEstablishment(Long id) {
        establishmentRepository.deleteById(id);
    }

    public boolean deleteEstablishmentWithCascade(Long id) {
        try {
            Optional<Establishment> establishmentOpt = establishmentRepository.findById(id);
            if (!establishmentOpt.isPresent()) {
                System.err.println("Establishment not found with ID: " + id);
                return false;
            }
            
            Establishment establishment = establishmentOpt.get();
            System.out.println("Deleting establishment: " + establishment.getName());
            
            // The cascade delete will automatically handle:
            // 1. All bookings related to this establishment
            // 2. All reviews for this establishment
            // 3. All menus (for hotels)
            // 4. All doctors (for hospitals)
            // 5. All collections (for shops)
            // 6. All special offers
            
            // Send notification email to owner about deletion before deleting
            try {
                if (establishment.getEmail() != null && !establishment.getEmail().trim().isEmpty()) {
                    String subject = "Establishment Deleted";
                    String body = String.format(
                        "Dear %s,\n\n" +
                        "Your establishment has been deleted by the administrator.\n\n" +
                        "Establishment Details:\n" +
                        "Name: %s\n" +
                        "Type: %s\n" +
                        "Email: %s\n" +
                        "Address: %s\n\n" +
                        "All associated data including bookings, reviews, and other information has been removed.\n\n" +
                        "If you believe this was done in error, please contact our support team.\n\n" +
                        "Best regards,\n" +
                        "OpenNova Admin Team",
                        establishment.getName(),
                        establishment.getName(),
                        establishment.getType().name(),
                        establishment.getEmail(),
                        establishment.getAddress()
                    );
                    
                    emailService.sendEmail(establishment.getEmail(), subject, body);
                    System.out.println("Deletion notification email sent successfully");
                }
            } catch (Exception e) {
                // Log email error but don't fail the deletion
                System.err.println("Failed to send deletion notification email: " + e.getMessage());
            }
            
            // Delete the establishment - JPA cascade will handle related entities
            establishmentRepository.deleteById(id);
            System.out.println("Establishment deleted successfully");
            
            return true;
        } catch (Exception e) {
            System.err.println("Error deleting establishment: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    // Status Management
    public Establishment updateStatus(Long id, EstablishmentStatus status) {
        Optional<Establishment> existingEstablishment = establishmentRepository.findById(id);
        if (existingEstablishment.isPresent()) {
            Establishment establishment = existingEstablishment.get();
            establishment.setStatus(status);
            establishment.setUpdatedAt(LocalDateTime.now());
            Establishment savedEstablishment = establishmentRepository.save(establishment);
            
            // Update real-time state
            if (establishment.getOwner() != null) {
                realTimeUpdateService.updateEstablishmentStatus(id, status.toString(), establishment.getOwner().getId());
            }
            
            return savedEstablishment;
        }
        return null;
    }

    public Establishment updateActiveStatus(Long id, Boolean isActive) {
        Optional<Establishment> existingEstablishment = establishmentRepository.findById(id);
        if (existingEstablishment.isPresent()) {
            Establishment establishment = existingEstablishment.get();
            establishment.setIsActive(isActive);
            establishment.setUpdatedAt(LocalDateTime.now());
            Establishment savedEstablishment = establishmentRepository.save(establishment);
            
            // Send notification email to owner
            try {
                if (establishment.getEmail() != null && !establishment.getEmail().trim().isEmpty()) {
                    String subject = isActive ? "Establishment Activated" : "Establishment Suspended";
                    String action = isActive ? "activated" : "suspended";
                    String body = String.format(
                        "Dear %s,\n\n" +
                        "Your establishment has been %s by the administrator.\n\n" +
                        "Establishment Details:\n" +
                        "Name: %s\n" +
                        "Type: %s\n" +
                        "Email: %s\n" +
                        "Address: %s\n\n" +
                        "%s\n\n" +
                        "Best regards,\n" +
                        "OpenNova Admin Team",
                        establishment.getName(),
                        action,
                        establishment.getName(),
                        establishment.getType().name(),
                        establishment.getEmail(),
                        establishment.getAddress(),
                        isActive ? "Your establishment is now active and can accept bookings." 
                                : "Your establishment has been suspended and cannot accept new bookings. Please contact support if you believe this was done in error."
                    );
                    
                    emailService.sendEmail(establishment.getEmail(), subject, body);
                    System.out.println("Status change notification email sent successfully");
                }
            } catch (Exception e) {
                // Log email error but don't fail the status update
                System.err.println("Failed to send status change notification email: " + e.getMessage());
            }
            
            // Update real-time state
            if (establishment.getOwner() != null) {
                realTimeUpdateService.updateEstablishmentStatus(id, isActive ? "ACTIVE" : "SUSPENDED", establishment.getOwner().getId());
            }
            
            return savedEstablishment;
        }
        return null;
    }
    
    // Real-time status update method for owners
    public Establishment updateStatusByOwner(Long establishmentId, String status, Long ownerId) {
        try {
            Optional<Establishment> existingEstablishment = establishmentRepository.findById(establishmentId);
            if (existingEstablishment.isPresent()) {
                Establishment establishment = existingEstablishment.get();
                
                // Verify ownership
                if (!establishment.getOwner().getId().equals(ownerId)) {
                    throw new RuntimeException("Unauthorized to update this establishment");
                }
                
                EstablishmentStatus newStatus = EstablishmentStatus.valueOf(status.toUpperCase());
                establishment.setStatus(newStatus);
                establishment.setUpdatedAt(LocalDateTime.now());
                Establishment savedEstablishment = establishmentRepository.save(establishment);
                
                // Update real-time state
                realTimeUpdateService.updateEstablishmentStatus(establishmentId, status, ownerId);
                
                return savedEstablishment;
            }
            return null;
        } catch (Exception e) {
            System.err.println("Failed to update establishment status: " + e.getMessage());
            throw new RuntimeException("Failed to update establishment status: " + e.getMessage());
        }
    }

    // Search and Filter
    public List<Establishment> searchEstablishments(String query) {
        return establishmentRepository.findByNameContainingIgnoreCaseOrAddressContainingIgnoreCase(query, query);
    }

    public List<Establishment> findNearbyEstablishments(Double latitude, Double longitude, Double radiusKm) {
        // Implementation for finding nearby establishments within radius
        // This would require a spatial query or distance calculation
        return establishmentRepository.findAll(); // Placeholder
    }

    // Statistics
    public long getTotalEstablishments() {
        return establishmentRepository.count();
    }

    public long getEstablishmentsByType(EstablishmentType type) {
        return establishmentRepository.countByType(type);
    }

    public long getEstablishmentsByStatus(EstablishmentStatus status) {
        return establishmentRepository.countByStatus(status);
    }

    // Booking Management Helper Methods
    public boolean approveBooking(Long bookingId, String ownerEmail) {
        try {
            // Find the establishment by owner email
            Establishment establishment = findByEmail(ownerEmail);
            if (establishment == null) {
                return false;
            }

            // Find the booking and update status
            // This would require a BookingRepository and Booking entity
            // For now, we'll simulate the approval process
            
            // Send confirmation email with QR code
            // emailService.sendBookingConfirmation(booking);
            
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean rejectBooking(Long bookingId, String ownerEmail) {
        try {
            // Find the establishment by owner email
            Establishment establishment = findByEmail(ownerEmail);
            if (establishment == null) {
                return false;
            }

            // Find the booking and update status
            // This would require a BookingRepository and Booking entity
            // For now, we'll simulate the rejection process
            
            // Initiate refund process
            // paymentService.processRefund(booking);
            
            // Send rejection email
            // emailService.sendBookingRejection(booking);
            
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // Validation Methods
    public boolean isValidEstablishment(Establishment establishment) {
        return establishment != null &&
               establishment.getName() != null && !establishment.getName().trim().isEmpty() &&
               establishment.getEmail() != null && !establishment.getEmail().trim().isEmpty() &&
               establishment.getAddress() != null && !establishment.getAddress().trim().isEmpty() &&
               establishment.getType() != null;
    }

    public String validateAndCleanPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return null; // Return null for empty phone numbers to avoid database constraint issues
        }
        
        String cleanPhone = phoneNumber.trim().replaceAll("[^+0-9]", ""); // Remove non-numeric chars except +
        if (cleanPhone.matches("^\\+?[0-9]{10,15}$")) {
            return cleanPhone;
        } else {
            return null; // Return null for invalid format to avoid database constraint issues
        }
    }

    public boolean isOwnerOfEstablishment(String ownerEmail, Long establishmentId) {
        Establishment establishment = findById(establishmentId);
        return establishment != null && establishment.getEmail().equals(ownerEmail);
    }

    // Business Logic Methods
    public boolean canAcceptBookings(Long establishmentId) {
        Establishment establishment = findById(establishmentId);
        return establishment != null && 
               establishment.getStatus() == EstablishmentStatus.OPEN &&
               establishment.getIsActive();
    }

    public double calculateAverageRating(Long establishmentId) {
        try {
            // Get actual reviews from ReviewService
            if (reviewService != null) {
                List<com.opennova.model.Review> reviews = reviewService.getEstablishmentReviews(establishmentId);
                if (reviews != null && !reviews.isEmpty()) {
                    double sum = reviews.stream().mapToInt(com.opennova.model.Review::getRating).sum();
                    return sum / reviews.size();
                }
            }
            return 0.0; // No reviews yet
        } catch (Exception e) {
            System.err.println("Error calculating average rating for establishment " + establishmentId + ": " + e.getMessage());
            return 0.0;
        }
    }

    public int getTotalReviews(Long establishmentId) {
        try {
            // Get actual review count from ReviewService
            if (reviewService != null) {
                List<com.opennova.model.Review> reviews = reviewService.getEstablishmentReviews(establishmentId);
                return reviews != null ? reviews.size() : 0;
            }
            return 0;
        } catch (Exception e) {
            System.err.println("Error getting total reviews for establishment " + establishmentId + ": " + e.getMessage());
            return 0;
        }
    }

    // Operating Hours Management
    public boolean isOpenNow(Long establishmentId) {
        Establishment establishment = findById(establishmentId);
        if (establishment == null || establishment.getOperatingHours() == null) {
            return false;
        }
        
        // Parse operating hours and check if current time falls within
        // This is a simplified implementation
        LocalDateTime now = LocalDateTime.now();
        int currentHour = now.getHour();
        
        // Assuming operating hours format: "9:00 AM - 9:00 PM"
        // This would need proper parsing logic
        return establishment.getStatus() == EstablishmentStatus.OPEN && currentHour >= 9 && currentHour < 21;
    }

    // Weekly Schedule Management
    public Establishment updateWeeklySchedule(Long establishmentId, String weeklySchedule) {
        Optional<Establishment> existingEstablishment = establishmentRepository.findById(establishmentId);
        if (existingEstablishment.isPresent()) {
            Establishment establishment = existingEstablishment.get();
            establishment.setWeeklySchedule(weeklySchedule);
            establishment.setUpdatedAt(LocalDateTime.now());
            return establishmentRepository.save(establishment);
        }
        return null;
    }

    // Data Export Methods
    public List<Establishment> getEstablishmentsForExport(String ownerEmail) {
        // Return establishments owned by the specific owner
        // This would require proper owner-establishment relationship
        return List.of(findByEmail(ownerEmail));
    }

    public long getTotalBookings() {
        // This would require a BookingRepository to get actual count
        // For now return 0, will be implemented when BookingRepository is available
        return 0;
    }

    public long getActiveEstablishments() {
        return establishmentRepository.countByIsActiveAndStatus(true, EstablishmentStatus.OPEN);
    }

    // Location Management Methods
    public Establishment updateLocation(Long establishmentId, Double latitude, Double longitude, String address) {
        Optional<Establishment> existingEstablishment = establishmentRepository.findById(establishmentId);
        if (existingEstablishment.isPresent()) {
            Establishment establishment = existingEstablishment.get();
            establishment.setLatitude(latitude);
            establishment.setLongitude(longitude);
            if (address != null && !address.trim().isEmpty()) {
                establishment.setAddress(address);
            }
            establishment.setUpdatedAt(LocalDateTime.now());
            return establishmentRepository.save(establishment);
        }
        return null;
    }

    public Establishment deleteLocation(Long establishmentId) {
        Optional<Establishment> existingEstablishment = establishmentRepository.findById(establishmentId);
        if (existingEstablishment.isPresent()) {
            Establishment establishment = existingEstablishment.get();
            establishment.setLatitude(null);
            establishment.setLongitude(null);
            establishment.setUpdatedAt(LocalDateTime.now());
            return establishmentRepository.save(establishment);
        }
        return null;
    }

    public boolean hasValidLocation(Long establishmentId) {
        Establishment establishment = findById(establishmentId);
        return establishment != null && 
               establishment.getLatitude() != null && 
               establishment.getLongitude() != null;
    }

    public List<Establishment> findEstablishmentsWithLocation() {
        return establishmentRepository.findAll().stream()
                .filter(est -> est.getLatitude() != null && est.getLongitude() != null)
                .collect(Collectors.toList());
    }

    public List<Establishment> findNearbyEstablishmentsWithCoordinates(Double latitude, Double longitude, Double radiusKm) {
        if (latitude == null || longitude == null || radiusKm == null) {
            return new ArrayList<>();
        }

        return establishmentRepository.findAll().stream()
                .filter(est -> est.getLatitude() != null && est.getLongitude() != null)
                .filter(est -> {
                    double distance = calculateDistance(latitude, longitude, est.getLatitude(), est.getLongitude());
                    return distance <= radiusKm;
                })
                .collect(Collectors.toList());
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // Haversine formula to calculate distance between two points on Earth
        final int R = 6371; // Radius of the earth in km

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c; // Distance in km

        return distance;
    }

    // Analytics methods
    public Map<String, Long> getEstablishmentCountByType() {
        try {
            List<Establishment> establishments = establishmentRepository.findAll();
            Map<String, Long> typeCount = new HashMap<>();
            
            for (Establishment est : establishments) {
                String type = est.getType() != null ? est.getType().name() : "UNKNOWN";
                typeCount.put(type, typeCount.getOrDefault(type, 0L) + 1);
            }
            
            return typeCount;
        } catch (Exception e) {
            System.err.println("Error getting establishment count by type: " + e.getMessage());
            // Return empty map on error
            return new HashMap<>();
        }
    }

    public Map<String, Long> getEstablishmentCountByStatus() {
        try {
            List<Establishment> establishments = establishmentRepository.findAll();
            Map<String, Long> statusCount = new HashMap<>();
            
            for (Establishment est : establishments) {
                String status = est.getStatus() != null ? est.getStatus().name() : "UNKNOWN";
                statusCount.put(status, statusCount.getOrDefault(status, 0L) + 1);
            }
            
            return statusCount;
        } catch (Exception e) {
            System.err.println("Error getting establishment count by status: " + e.getMessage());
            return new HashMap<>();
        }
    }

    public Map<String, Long> getEstablishmentCountByCity() {
        try {
            List<Establishment> establishments = establishmentRepository.findAll();
            Map<String, Long> cityCount = new HashMap<>();
            
            for (Establishment est : establishments) {
                String city = est.getCity() != null ? est.getCity() : "Unknown";
                cityCount.put(city, cityCount.getOrDefault(city, 0L) + 1);
            }
            
            return cityCount;
        } catch (Exception e) {
            System.err.println("Error getting establishment count by city: " + e.getMessage());
            return new HashMap<>();
        }
    }

    public Establishment createEstablishmentByAdmin(String name, String type, String email, 
            String address, String city, String state, String pincode, String phoneNumber,
            String operatingHours, String upiId, String ownerPassword) {
        try {
            // Use default password if none provided
            String finalPassword = (ownerPassword != null && !ownerPassword.trim().isEmpty()) 
                ? ownerPassword.trim() 
                : "OpenNova@123";
            
            System.out.println("🔐 EstablishmentService - Password analysis:");
            System.out.println("   - Received password: " + (ownerPassword != null ? "YES" : "NO"));
            System.out.println("   - Password not empty: " + (ownerPassword != null && !ownerPassword.trim().isEmpty()));
            System.out.println("   - Using: " + (ownerPassword != null && !ownerPassword.trim().isEmpty() ? "Admin provided password" : "Default password"));
            System.out.println("   - Final password length: " + finalPassword.length());
            
            // Check if user already exists
            User owner = userRepository.findByEmail(email).orElse(null);
            
            if (owner == null) {
                // Create new owner user
                owner = new User();
                owner.setName(name + " Owner");
                owner.setEmail(email);
                owner.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw(
                    finalPassword, 
                    org.springframework.security.crypto.bcrypt.BCrypt.gensalt()
                ));
                owner.setIsActive(true);
                
                // Set role based on establishment type
                try {
                    EstablishmentType estType = EstablishmentType.valueOf(type.toUpperCase());
                    switch (estType) {
                        case HOTEL:
                            owner.setRole(UserRole.HOTEL_OWNER);
                            break;
                        case HOSPITAL:
                            owner.setRole(UserRole.HOSPITAL_OWNER);
                            break;
                        case SHOP:
                            owner.setRole(UserRole.SHOP_OWNER);
                            break;
                        default:
                            owner.setRole(UserRole.OWNER);
                    }
                    owner.setEstablishmentType(estType.name());
                } catch (IllegalArgumentException e) {
                    owner.setRole(UserRole.OWNER);
                    owner.setEstablishmentType("SHOP");
                }
                
                // Save new owner
                owner = userRepository.save(owner);
                System.out.println("✅ Created new owner user: " + email);
            } else {
                // Update existing user to owner role
                try {
                    EstablishmentType estType = EstablishmentType.valueOf(type.toUpperCase());
                    switch (estType) {
                        case HOTEL:
                            owner.setRole(UserRole.HOTEL_OWNER);
                            break;
                        case HOSPITAL:
                            owner.setRole(UserRole.HOSPITAL_OWNER);
                            break;
                        case SHOP:
                            owner.setRole(UserRole.SHOP_OWNER);
                            break;
                        default:
                            owner.setRole(UserRole.OWNER);
                    }
                    owner.setEstablishmentType(estType.name());
                } catch (IllegalArgumentException e) {
                    owner.setRole(UserRole.OWNER);
                    owner.setEstablishmentType("SHOP");
                }
                
                // Update password and activate user
                owner.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw(
                    finalPassword, 
                    org.springframework.security.crypto.bcrypt.BCrypt.gensalt()
                ));
                owner.setIsActive(true);
                
                // Save updated owner
                owner = userRepository.save(owner);
                System.out.println("✅ Updated existing user to owner: " + email);
            }
            
            User savedOwner = owner;
            
            // Check if an establishment with this email already exists
            Establishment existingEstablishment = establishmentRepository.findByEmail(email).orElse(null);
            if (existingEstablishment != null) {
                String errorMsg = String.format("An establishment with email '%s' already exists: %s (ID: %d)", 
                    email, existingEstablishment.getName(), existingEstablishment.getId());
                System.err.println("❌ " + errorMsg);
                throw new RuntimeException(errorMsg);
            }
            
            // Check if user already owns an establishment
            List<Establishment> existingEstablishments = establishmentRepository.findByOwner(savedOwner);
            if (!existingEstablishments.isEmpty()) {
                String errorMsg = String.format("User '%s' already owns an establishment: %s (ID: %d)", 
                    email, existingEstablishments.get(0).getName(), existingEstablishments.get(0).getId());
                System.err.println("❌ " + errorMsg);
                throw new RuntimeException(errorMsg);
            }
            
            // Create establishment
            Establishment establishment = new Establishment();
            establishment.setName(name);
            establishment.setType(EstablishmentType.valueOf(type.toUpperCase()));
            establishment.setEmail(email);
            establishment.setAddress(address);
            establishment.setCity(city != null ? city : "");
            establishment.setState(state != null ? state : "");
            establishment.setPincode(pincode != null ? pincode : "");
            
            // Handle phone number - must be null if empty or invalid format
            establishment.setPhoneNumber(validateAndCleanPhoneNumber(phoneNumber));
            
            establishment.setOperatingHours(operatingHours != null ? operatingHours : "9:00 AM - 6:00 PM");
            establishment.setUpiId(upiId != null ? upiId : "");
            establishment.setOwner(savedOwner);
            establishment.setStatus(EstablishmentStatus.OPEN);
            establishment.setIsActive(true);
            
            // Save establishment
            Establishment savedEstablishment = establishmentRepository.save(establishment);
            
            // Send credentials email to owner
            try {
                emailService.sendOwnerCredentials(savedOwner, finalPassword);
                System.out.println("✅ Owner credentials email sent to: " + email);
            } catch (Exception e) {
                System.err.println("❌ Failed to send owner credentials email: " + e.getMessage());
                e.printStackTrace();
            }
            
            return savedEstablishment;
        } catch (Exception e) {
            System.err.println("Error creating establishment by admin: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create establishment: " + e.getMessage());
        }
    }
}