package com.opennova.service;

import com.opennova.model.PaymentVerification;
import com.opennova.model.Booking;
import com.opennova.model.BookingStatus;
import com.opennova.model.RefundStatus;
import com.opennova.repository.PaymentVerificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentScreenshotService {
    
    @Autowired
    private PaymentVerificationRepository paymentVerificationRepository;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    private static final String SCREENSHOT_UPLOAD_DIR = "uploads/payment-screenshots/";
    
    /**
     * Submit payment verification with screenshot
     */
    public PaymentVerification submitPaymentVerification(String transactionRef, String transactionId, 
                                                       String userEmail, Long establishmentId, 
                                                       BigDecimal expectedAmount, MultipartFile screenshot) {
        
        // Check if transaction ID is already used
        if (paymentVerificationRepository.existsByTransactionId(transactionId)) {
            throw new RuntimeException("Transaction ID already used: " + transactionId);
        }
        
        // Create payment verification record
        PaymentVerification verification = new PaymentVerification(
            transactionRef, transactionId, userEmail, establishmentId, expectedAmount
        );
        
        // Save screenshot if provided
        if (screenshot != null && !screenshot.isEmpty()) {
            try {
                String screenshotPath = saveScreenshot(screenshot, transactionRef);
                verification.setScreenshotPath(screenshotPath);
            } catch (IOException e) {
                throw new RuntimeException("Failed to save screenshot: " + e.getMessage());
            }
        }
        
        PaymentVerification saved = paymentVerificationRepository.save(verification);
        
        System.out.println("💳 Payment verification submitted: " + transactionRef + 
                          " for ₹" + expectedAmount + " (Screenshot: " + (screenshot != null ? "Yes" : "No") + ")");
        
        return saved;
    }
    
    /**
     * Get pending verifications for establishment owner
     */
    public List<PaymentVerification> getPendingVerifications(Long establishmentId) {
        return paymentVerificationRepository.findByEstablishmentIdAndStatus(
            establishmentId, PaymentVerification.VerificationStatus.PENDING_VERIFICATION
        );
    }
    
    @Autowired
    private BookingService bookingService;
    
    @Autowired
    private QRCodeService qrCodeService;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private UPIVerificationService upiVerificationService;
    
    /**
     * Approve payment verification - Generate QR and send email
     */
    public PaymentVerification approvePayment(Long verificationId, Long ownerId, String notes) {
        Optional<PaymentVerification> optVerification = paymentVerificationRepository.findById(verificationId);
        
        if (optVerification.isEmpty()) {
            throw new RuntimeException("Payment verification not found: " + verificationId);
        }
        
        PaymentVerification verification = optVerification.get();
        
        if (verification.getStatus() != PaymentVerification.VerificationStatus.PENDING_VERIFICATION) {
            throw new RuntimeException("Payment verification is not in pending status");
        }
        
        verification.setStatus(PaymentVerification.VerificationStatus.APPROVED);
        verification.setVerifiedAt(LocalDateTime.now());
        verification.setVerifiedBy(ownerId);
        verification.setOwnerNotes(notes);
        
        // Verify UPI transaction before approving
        try {
            UPIVerificationService.UPIVerificationResult upiResult = upiVerificationService.verifyTransaction(
                verification.getTransactionId(), 
                verification.getExpectedAmount(), 
                verification.getUserEmail()
            );
            
            if (!upiResult.isVerified()) {
                System.err.println("❌ UPI verification failed: " + upiResult.getMessage());
                verification.setOwnerNotes(notes + " | UPI Verification: " + upiResult.getMessage());
                // Continue with approval but log the UPI verification failure
            } else {
                System.out.println("✅ UPI transaction verified successfully");
                verification.setOwnerNotes(notes + " | UPI Verified: ₹" + upiResult.getActualAmount());
            }
        } catch (Exception e) {
            System.err.println("⚠️ UPI verification service error: " + e.getMessage());
            verification.setOwnerNotes(notes + " | UPI Verification Error: " + e.getMessage());
        }
        
        PaymentVerification approved = paymentVerificationRepository.save(verification);
        
        // Find and confirm the related booking
        try {
            // Look for booking by transaction reference (payment reference), not UPI transaction ID
            System.out.println("🔍 Looking for booking with transaction ID: " + verification.getTransactionRef());
            Booking booking = bookingService.findByTransactionId(verification.getTransactionRef());
            if (booking != null) {
                // Update booking status to CONFIRMED
                booking.setStatus(BookingStatus.CONFIRMED);
                booking.setConfirmedAt(LocalDateTime.now());
                
                // Generate QR code for the booking
                String qrCode = qrCodeService.generateBookingQRCode(booking);
                booking.setQrCode(qrCode);
                
                // Save the updated booking
                Booking confirmedBooking = bookingService.save(booking);
                
                // Send confirmation email with QR code to customer
                try {
                    emailService.sendBookingConfirmationWithQR(confirmedBooking);
                    System.out.println("📧 Confirmation email sent to: " + confirmedBooking.getUserEmail());
                } catch (Exception emailError) {
                    System.err.println("❌ Failed to send confirmation email: " + emailError.getMessage());
                    // Continue - payment is still approved even if email fails
                }
                
                System.out.println("✅ Payment approved → Booking confirmed → QR generated → Email sent");
                
            } else {
                System.err.println("⚠️ No booking found for payment reference: " + verification.getTransactionRef());
                System.err.println("🔍 Debug: Payment verification details:");
                System.err.println("   - Transaction Ref: " + verification.getTransactionRef());
                System.err.println("   - Transaction ID: " + verification.getTransactionId());
                System.err.println("   - User Email: " + verification.getUserEmail());
                System.err.println("   - Expected Amount: " + verification.getExpectedAmount());
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to process booking confirmation: " + e.getMessage());
            e.printStackTrace();
            // Don't throw exception here - payment is still approved
        }
        
        System.out.println("✅ Payment verification approved: " + verification.getTransactionRef() + 
                          " by owner ID: " + ownerId);
        
        return approved;
    }
    
    /**
     * Reject payment verification - Send rejection email
     */
    public PaymentVerification rejectPayment(Long verificationId, Long ownerId, String reason) {
        Optional<PaymentVerification> optVerification = paymentVerificationRepository.findById(verificationId);
        
        if (optVerification.isEmpty()) {
            throw new RuntimeException("Payment verification not found: " + verificationId);
        }
        
        PaymentVerification verification = optVerification.get();
        
        if (verification.getStatus() != PaymentVerification.VerificationStatus.PENDING_VERIFICATION) {
            throw new RuntimeException("Payment verification is not in pending status");
        }
        
        verification.setStatus(PaymentVerification.VerificationStatus.REJECTED);
        verification.setVerifiedAt(LocalDateTime.now());
        verification.setVerifiedBy(ownerId);
        verification.setOwnerNotes(reason);
        
        PaymentVerification rejected = paymentVerificationRepository.save(verification);
        
        // Find and cancel the related booking
        try {
            // Look for booking by transaction reference (payment reference), not UPI transaction ID
            Booking booking = bookingService.findByTransactionId(verification.getTransactionRef());
            if (booking != null) {
                // Update booking status to CANCELLED
                booking.setStatus(BookingStatus.CANCELLED);
                booking.setCancelledAt(LocalDateTime.now());
                booking.setCancellationReason("Payment verification rejected: " + reason);
                booking.setRefundStatus(RefundStatus.APPROVED); // Auto-approve refund for rejected payments
                
                // Save the updated booking
                Booking cancelledBooking = bookingService.save(booking);
                
                // Send rejection email to customer
                try {
                    emailService.sendPaymentRejectionEmail(
                        cancelledBooking.getUserEmail(),
                        cancelledBooking.getEstablishment().getName(),
                        reason,
                        cancelledBooking.getPaymentAmount().doubleValue()
                    );
                    System.out.println("📧 Rejection email sent to: " + cancelledBooking.getUserEmail());
                } catch (Exception emailError) {
                    System.err.println("❌ Failed to send rejection email: " + emailError.getMessage());
                    // Continue - payment is still rejected even if email fails
                }
                
                System.out.println("✅ Payment rejected → Booking cancelled → Rejection email sent");
                
            } else {
                System.err.println("⚠️ No booking found for payment reference: " + verification.getTransactionRef());
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to process booking cancellation: " + e.getMessage());
            e.printStackTrace();
            // Don't throw exception here - payment is still rejected
        }
        
        System.out.println("❌ Payment verification rejected: " + verification.getTransactionRef() + 
                          " by owner ID: " + ownerId + " Reason: " + reason);
        
        return rejected;
    }
    
    /**
     * Get verification by transaction reference
     */
    public Optional<PaymentVerification> getVerificationByTransactionRef(String transactionRef) {
        return paymentVerificationRepository.findByTransactionRef(transactionRef);
    }
    
    /**
     * Get user's payment verifications
     */
    public List<PaymentVerification> getUserVerifications(String userEmail) {
        return paymentVerificationRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
    }
    
    /**
     * Save screenshot file
     */
    private String saveScreenshot(MultipartFile screenshot, String transactionRef) throws IOException {
        // Create directory if it doesn't exist
        Path uploadDir = Paths.get(SCREENSHOT_UPLOAD_DIR);
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }
        
        // Generate unique filename
        String originalFilename = screenshot.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".") 
            ? originalFilename.substring(originalFilename.lastIndexOf("."))
            : ".jpg";
        
        String filename = transactionRef + "_" + UUID.randomUUID().toString() + extension;
        Path filePath = uploadDir.resolve(filename);
        
        // Save file
        Files.copy(screenshot.getInputStream(), filePath);
        
        return SCREENSHOT_UPLOAD_DIR + filename;
    }
    
    /**
     * Delete payment verification
     */
    public boolean deletePaymentVerification(Long verificationId, Long ownerId) {
        try {
            Optional<PaymentVerification> optVerification = paymentVerificationRepository.findById(verificationId);
            
            if (optVerification.isEmpty()) {
                System.err.println("❌ Payment verification not found: " + verificationId);
                return false;
            }
            
            PaymentVerification verification = optVerification.get();
            
            // Delete screenshot file if exists
            if (verification.getScreenshotPath() != null && !verification.getScreenshotPath().trim().isEmpty()) {
                try {
                    Path screenshotPath = Paths.get(verification.getScreenshotPath());
                    if (Files.exists(screenshotPath)) {
                        Files.delete(screenshotPath);
                        System.out.println("🗑️ Screenshot file deleted: " + verification.getScreenshotPath());
                    }
                } catch (IOException e) {
                    System.err.println("⚠️ Failed to delete screenshot file: " + e.getMessage());
                    // Continue with database deletion even if file deletion fails
                }
            }
            
            // Delete from database
            paymentVerificationRepository.delete(verification);
            
            System.out.println("🗑️ Payment verification deleted: " + verification.getTransactionRef() + 
                              " by owner ID: " + ownerId);
            
            return true;
            
        } catch (Exception e) {
            System.err.println("❌ Failed to delete payment verification: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Get screenshot file path
     */
    public String getScreenshotPath(Long verificationId) {
        Optional<PaymentVerification> verification = paymentVerificationRepository.findById(verificationId);
        return verification.map(PaymentVerification::getScreenshotPath).orElse(null);
    }
}