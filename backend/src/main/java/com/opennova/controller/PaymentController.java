package com.opennova.controller;

import com.opennova.service.PaymentVerificationService;
import com.opennova.service.PaymentScreenshotService;
import com.opennova.service.EstablishmentService;
import com.opennova.service.UserService;
import com.opennova.service.QRCodeService;
import com.opennova.model.User;
import com.opennova.model.Establishment;
import com.opennova.model.PaymentVerification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002", "http://127.0.0.1:3002", "http://localhost:3003", "http://127.0.0.1:3003"})
public class PaymentController {

    @Autowired
    private PaymentVerificationService paymentVerificationService;
    
    @Autowired
    private PaymentScreenshotService paymentScreenshotService;
    
    @Autowired
    private EstablishmentService establishmentService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private QRCodeService qrCodeService;

    /**
     * Generate secure payment request
     */
    @PostMapping("/generate-request")
    public ResponseEntity<?> generatePaymentRequest(@RequestBody Map<String, Object> requestData, 
                                                  Authentication authentication) {
        try {
            // Get authenticated user
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            // Extract request data
            Long establishmentId = Long.valueOf(requestData.get("establishmentId").toString());
            Double amount = Double.valueOf(requestData.get("amount").toString());
            Long bookingId = requestData.get("bookingId") != null ? 
                Long.valueOf(requestData.get("bookingId").toString()) : null;
            
            // Get establishment
            Establishment establishment = establishmentService.findById(establishmentId);
            if (establishment == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Establishment not found");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Validate UPI ID
            String upiId = establishment.getUpiId();
            if (upiId == null || upiId.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Establishment UPI ID not configured");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Generate payment request
            PaymentVerificationService.PaymentRequest paymentRequest = 
                paymentVerificationService.generatePaymentRequest(
                    upiId, amount, user.getEmail(), bookingId);
            
            // Return payment details including establishment info for QR code
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("transactionRef", paymentRequest.getTransactionRef());
            response.put("upiId", paymentRequest.getUpiId());
            response.put("amount", paymentRequest.getAmount());
            response.put("expiryTime", paymentRequest.getExpiryTime());
            response.put("establishmentName", establishment.getName());
            
            // Include establishment UPI QR code path if available
            if (establishment.getUpiQrCodePath() != null && !establishment.getUpiQrCodePath().trim().isEmpty()) {
                response.put("establishmentUpiQrCodePath", establishment.getUpiQrCodePath());
                System.out.println("✅ Including establishment UPI QR code path: " + establishment.getUpiQrCodePath());
            } else {
                System.out.println("⚠️ No UPI QR code uploaded by establishment: " + establishment.getName());
            }
            
            // Generate UPI payment URL
            String upiUrl = String.format(
                "upi://pay?pa=%s&am=%.2f&tn=%s&tr=%s",
                upiId,
                amount,
                "Booking for " + establishment.getName(),
                paymentRequest.getTransactionRef()
            );
            response.put("upiUrl", upiUrl);
            
            // Generate payment QR code
            try {
                String paymentQRCode = qrCodeService.generatePaymentQRCode(upiUrl, amount, establishment.getName());
                response.put("paymentQRCode", paymentQRCode);
                System.out.println("✅ Generated payment QR code for amount: ₹" + amount);
            } catch (Exception e) {
                System.err.println("❌ Failed to generate payment QR code: " + e.getMessage());
                // Continue without QR code - not critical for payment
            }
            
            System.out.println("🔐 Generated payment request for user: " + user.getEmail() + 
                             " Amount: ₹" + amount + " Ref: " + paymentRequest.getTransactionRef());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to generate payment request: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to generate payment request: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Verify payment with UPI transaction ID - STRICT AMOUNT VALIDATION
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, Object> verificationData, 
                                         Authentication authentication) {
        try {
            // Get authenticated user
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            String transactionRef = (String) verificationData.get("transactionRef");
            String upiTransactionId = (String) verificationData.get("upiTransactionId");
            
            if (transactionRef == null || upiTransactionId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Transaction reference and UPI transaction ID are required");
                return ResponseEntity.badRequest().body(error);
            }
            
            System.out.println("🔍 STRICT Payment verification for user: " + user.getEmail() + 
                             " Ref: " + transactionRef + " UPI TXN: " + upiTransactionId);
            
            // STRICT VERIFICATION - Only valid transaction IDs with exact amounts are accepted
            PaymentVerificationService.PaymentVerificationResult result = 
                paymentVerificationService.verifyPayment(transactionRef, upiTransactionId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("verified", result.isVerified());
            response.put("message", result.getMessage());
            
            if (result.isVerified()) {
                response.put("verifiedAt", result.getPayment().getVerifiedAt());
                response.put("amount", result.getPayment().getAmount());
                
                System.out.println("✅ STRICT Payment verified for user: " + user.getEmail() + 
                                 " Ref: " + transactionRef + " UPI TXN: " + upiTransactionId + 
                                 " Amount: ₹" + result.getPayment().getAmount());
            } else {
                System.out.println("❌ STRICT Payment verification FAILED for user: " + user.getEmail() + 
                                 " Ref: " + transactionRef + " Reason: " + result.getMessage());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Payment verification error: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Payment verification failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Verify payment with strict amount validation - NEW ENDPOINT
     */
    @PostMapping("/verify-strict")
    public ResponseEntity<?> verifyPaymentStrict(@RequestBody Map<String, Object> verificationData, 
                                               Authentication authentication) {
        try {
            // Get authenticated user
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            String transactionRef = (String) verificationData.get("transactionRef");
            String upiTransactionId = (String) verificationData.get("upiTransactionId");
            Double paidAmount = Double.valueOf(verificationData.get("paidAmount").toString());
            
            if (transactionRef == null || upiTransactionId == null || paidAmount == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Transaction reference, UPI transaction ID, and paid amount are required");
                return ResponseEntity.badRequest().body(error);
            }
            
            System.out.println("🔍 ULTRA-STRICT Payment verification for user: " + user.getEmail() + 
                             " Ref: " + transactionRef + " UPI TXN: " + upiTransactionId + " Claimed Amount: ₹" + paidAmount);
            
            // ULTRA-STRICT VERIFICATION - Must pay exact amount
            PaymentVerificationService.PaymentVerificationResult result = 
                paymentVerificationService.verifyPaymentWithStrictAmount(transactionRef, upiTransactionId, paidAmount);
            
            Map<String, Object> response = new HashMap<>();
            response.put("verified", result.isVerified());
            response.put("message", result.getMessage());
            
            if (result.isVerified()) {
                response.put("verifiedAt", result.getPayment().getVerifiedAt());
                response.put("amount", result.getPayment().getAmount());
                
                System.out.println("✅ ULTRA-STRICT Payment verified for user: " + user.getEmail() + 
                                 " Ref: " + transactionRef + " UPI TXN: " + upiTransactionId + 
                                 " EXACT Amount: ₹" + result.getPayment().getAmount());
            } else {
                System.out.println("❌ ULTRA-STRICT Payment verification FAILED for user: " + user.getEmail() + 
                                 " Ref: " + transactionRef + " Reason: " + result.getMessage());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Strict payment verification error: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Strict payment verification failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Check payment status
     */
    @GetMapping("/status/{transactionRef}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable String transactionRef, 
                                            Authentication authentication) {
        try {
            String status = paymentVerificationService.getPaymentStatus(transactionRef);
            
            Map<String, Object> response = new HashMap<>();
            response.put("transactionRef", transactionRef);
            response.put("status", status);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get payment status: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Verify payment amount (for owners)
     */
    @PostMapping("/verify-amount")
    public ResponseEntity<?> verifyPaymentAmount(@RequestBody Map<String, Object> verificationData, 
                                               Authentication authentication) {
        try {
            // Get authenticated user (should be owner)
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            String transactionRef = (String) verificationData.get("transactionRef");
            Double actualAmount = Double.valueOf(verificationData.get("actualAmount").toString());
            
            if (transactionRef == null || actualAmount == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Transaction reference and actual amount are required");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Verify amount
            boolean amountMatches = paymentVerificationService.verifyPaymentAmount(transactionRef, actualAmount);
            
            Map<String, Object> response = new HashMap<>();
            response.put("amountVerified", amountMatches);
            response.put("transactionRef", transactionRef);
            response.put("actualAmount", actualAmount);
            
            if (amountMatches) {
                response.put("message", "Payment amount verified successfully");
                System.out.println("✅ Amount verified by owner: " + user.getEmail() + 
                                 " Ref: " + transactionRef + " Amount: ₹" + actualAmount);
            } else {
                response.put("message", "Payment amount does not match expected amount");
                System.out.println("❌ Amount verification failed by owner: " + user.getEmail() + 
                                 " Ref: " + transactionRef + " Amount: ₹" + actualAmount);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Amount verification error: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Amount verification failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Submit payment verification with screenshot
     */
    @PostMapping("/verify-with-screenshot")
    public ResponseEntity<?> verifyPaymentWithScreenshot(
            @RequestParam("transactionRef") String transactionRef,
            @RequestParam("transactionId") String transactionId,
            @RequestParam("amount") String amountStr,
            @RequestParam("establishmentId") String establishmentIdStr,
            @RequestParam(value = "screenshot", required = false) MultipartFile screenshot,
            Authentication authentication) {
        
        try {
            // Get authenticated user
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            // Parse parameters
            BigDecimal expectedAmount = new BigDecimal(amountStr);
            Long establishmentId = Long.valueOf(establishmentIdStr);
            
            // Submit payment verification
            PaymentVerification verification = paymentScreenshotService.submitPaymentVerification(
                transactionRef, transactionId, user.getEmail(), establishmentId, expectedAmount, screenshot
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment verification submitted successfully. Owner will review and approve.");
            response.put("verificationId", verification.getId());
            response.put("status", verification.getStatus().toString());
            response.put("hasScreenshot", verification.getScreenshotPath() != null);
            
            System.out.println("📸 Payment verification with screenshot submitted: " + transactionRef + 
                             " by user: " + user.getEmail() + " Amount: ₹" + expectedAmount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Screenshot verification error: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Screenshot verification failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Get payment verification status
     */
    @GetMapping("/verification-status/{transactionRef}")
    public ResponseEntity<?> getVerificationStatus(@PathVariable String transactionRef, 
                                                 Authentication authentication) {
        try {
            // Get authenticated user
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            Optional<PaymentVerification> verification = 
                paymentScreenshotService.getVerificationByTransactionRef(transactionRef);
            
            if (verification.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("found", false);
                response.put("message", "Payment verification not found");
                return ResponseEntity.ok(response);
            }
            
            PaymentVerification v = verification.get();
            
            // Check if user owns this verification
            if (!user.getEmail().equals(v.getUserEmail())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Access denied");
                return ResponseEntity.status(403).body(error);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("found", true);
            response.put("status", v.getStatus().toString());
            response.put("transactionId", v.getTransactionId());
            response.put("expectedAmount", v.getExpectedAmount());
            response.put("hasScreenshot", v.getScreenshotPath() != null);
            response.put("createdAt", v.getCreatedAt());
            response.put("verifiedAt", v.getVerifiedAt());
            response.put("ownerNotes", v.getOwnerNotes());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Get verification status error: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get verification status: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Get user's payment verifications
     */
    @GetMapping("/my-verifications")
    public ResponseEntity<?> getMyVerifications(Authentication authentication) {
        try {
            // Get authenticated user
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            List<PaymentVerification> verifications = 
                paymentScreenshotService.getUserVerifications(user.getEmail());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("verifications", verifications);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Get user verifications error: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get verifications: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}