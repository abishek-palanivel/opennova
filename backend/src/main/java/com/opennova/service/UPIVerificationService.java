package com.opennova.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class UPIVerificationService {
    
    // Mock UPI transaction database for testing
    // In real implementation, this would connect to UPI gateway API
    private static final Map<String, MockUPITransaction> mockTransactions = new HashMap<>();
    
    static {
        // Add some mock transactions for testing
        mockTransactions.put("T240320000000021", new MockUPITransaction("T240320000000021", new BigDecimal("21.00"), "SUCCESS", "abishekjothi26@gmail.com"));
        mockTransactions.put("T240320000000105", new MockUPITransaction("T240320000000105", new BigDecimal("105.00"), "SUCCESS", "test@gmail.com"));
        mockTransactions.put("T240320000000070", new MockUPITransaction("T240320000000070", new BigDecimal("70.00"), "SUCCESS", "user@gmail.com"));
        
        // Add more realistic transaction IDs that match the pattern used in the system
        mockTransactions.put("OPNV1774012552572164BE804", new MockUPITransaction("OPNV1774012552572164BE804", new BigDecimal("21.00"), "SUCCESS", "abishekjothi26@gmail.com"));
        mockTransactions.put("OPNV1774012552572164BE805", new MockUPITransaction("OPNV1774012552572164BE805", new BigDecimal("105.00"), "SUCCESS", "test@gmail.com"));
        mockTransactions.put("OPNV1774012552572164BE806", new MockUPITransaction("OPNV1774012552572164BE806", new BigDecimal("70.00"), "SUCCESS", "user@gmail.com"));
        mockTransactions.put("OPNV1774012552572164BE807", new MockUPITransaction("OPNV1774012552572164BE807", new BigDecimal("140.00"), "SUCCESS", "customer@gmail.com"));
        mockTransactions.put("OPNV1774012552572164BE808", new MockUPITransaction("OPNV1774012552572164BE808", new BigDecimal("210.00"), "SUCCESS", "booking@gmail.com"));
        
        // Add some common amounts for testing
        mockTransactions.put("UPI123456789", new MockUPITransaction("UPI123456789", new BigDecimal("35.00"), "SUCCESS", "test@example.com"));
        mockTransactions.put("TXN987654321", new MockUPITransaction("TXN987654321", new BigDecimal("175.00"), "SUCCESS", "demo@example.com"));
    }
    
    /**
     * Verify UPI transaction ID and amount
     */
    public UPIVerificationResult verifyTransaction(String upiTransactionId, BigDecimal expectedAmount, String userEmail) {
        try {
            System.out.println("🔍 Verifying UPI transaction:");
            System.out.println("   - Transaction ID: " + upiTransactionId);
            System.out.println("   - Expected Amount: ₹" + expectedAmount);
            System.out.println("   - User Email: " + userEmail);
            
            // Validate transaction ID format
            if (!isValidUPITransactionId(upiTransactionId)) {
                return new UPIVerificationResult(false, "Invalid UPI transaction ID format", null, null);
            }
            
            // Check mock database (in real implementation, call UPI gateway API)
            MockUPITransaction transaction = mockTransactions.get(upiTransactionId);
            
            if (transaction == null) {
                System.out.println("❌ Transaction not found in UPI records");
                return new UPIVerificationResult(false, "Transaction not found in UPI records", null, null);
            }
            
            // Verify transaction status
            if (!"SUCCESS".equals(transaction.getStatus())) {
                System.out.println("❌ Transaction status is not SUCCESS: " + transaction.getStatus());
                return new UPIVerificationResult(false, "Transaction was not successful", null, null);
            }
            
            // Verify amount matches
            if (transaction.getAmount().compareTo(expectedAmount) != 0) {
                System.out.println("❌ Amount mismatch - Expected: ₹" + expectedAmount + ", Actual: ₹" + transaction.getAmount());
                return new UPIVerificationResult(false, 
                    "Amount mismatch - Expected: ₹" + expectedAmount + ", Actual: ₹" + transaction.getAmount(), 
                    transaction.getAmount(), transaction.getStatus());
            }
            
            // Verify user email (optional check)
            if (userEmail != null && !userEmail.equals(transaction.getUserEmail())) {
                System.out.println("⚠️ Email mismatch - Expected: " + userEmail + ", Transaction: " + transaction.getUserEmail());
                // Don't fail for email mismatch, just log it
            }
            
            System.out.println("✅ UPI transaction verified successfully");
            return new UPIVerificationResult(true, "Transaction verified successfully", 
                transaction.getAmount(), transaction.getStatus());
            
        } catch (Exception e) {
            System.err.println("❌ UPI verification error: " + e.getMessage());
            return new UPIVerificationResult(false, "Verification failed: " + e.getMessage(), null, null);
        }
    }
    
    /**
     * Validate UPI transaction ID format
     */
    private boolean isValidUPITransactionId(String transactionId) {
        if (transactionId == null || transactionId.trim().isEmpty()) {
            return false;
        }
        
        // Basic validation - UPI transaction IDs are typically 12-16 characters
        // and contain alphanumeric characters
        Pattern pattern = Pattern.compile("^[A-Za-z0-9]{8,20}$");
        return pattern.matcher(transactionId.trim()).matches();
    }
    
    /**
     * Mock UPI Transaction class
     */
    private static class MockUPITransaction {
        private String transactionId;
        private BigDecimal amount;
        private String status;
        private String userEmail;
        
        public MockUPITransaction(String transactionId, BigDecimal amount, String status, String userEmail) {
            this.transactionId = transactionId;
            this.amount = amount;
            this.status = status;
            this.userEmail = userEmail;
        }
        
        public String getTransactionId() { return transactionId; }
        public BigDecimal getAmount() { return amount; }
        public String getStatus() { return status; }
        public String getUserEmail() { return userEmail; }
    }
    
    /**
     * UPI Verification Result class
     */
    public static class UPIVerificationResult {
        private boolean verified;
        private String message;
        private BigDecimal actualAmount;
        private String transactionStatus;
        
        public UPIVerificationResult(boolean verified, String message, BigDecimal actualAmount, String transactionStatus) {
            this.verified = verified;
            this.message = message;
            this.actualAmount = actualAmount;
            this.transactionStatus = transactionStatus;
        }
        
        public boolean isVerified() { return verified; }
        public String getMessage() { return message; }
        public BigDecimal getActualAmount() { return actualAmount; }
        public String getTransactionStatus() { return transactionStatus; }
    }
}