package com.opennova.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_verifications")
public class PaymentVerification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "transaction_ref", nullable = false)
    private String transactionRef;
    
    @Column(name = "transaction_id", nullable = false)
    private String transactionId;
    
    @Column(name = "user_email", nullable = false)
    private String userEmail;
    
    @Column(name = "establishment_id", nullable = false)
    private Long establishmentId;
    
    @Column(name = "expected_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal expectedAmount;
    
    @Column(name = "screenshot_path")
    private String screenshotPath;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private VerificationStatus status = VerificationStatus.PENDING_VERIFICATION;
    
    @Column(name = "owner_notes", columnDefinition = "TEXT")
    private String ownerNotes;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
    
    @Column(name = "verified_by")
    private Long verifiedBy;
    
    // Constructors
    public PaymentVerification() {
        this.createdAt = LocalDateTime.now();
    }
    
    public PaymentVerification(String transactionRef, String transactionId, String userEmail, 
                             Long establishmentId, BigDecimal expectedAmount) {
        this();
        this.transactionRef = transactionRef;
        this.transactionId = transactionId;
        this.userEmail = userEmail;
        this.establishmentId = establishmentId;
        this.expectedAmount = expectedAmount;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTransactionRef() {
        return transactionRef;
    }
    
    public void setTransactionRef(String transactionRef) {
        this.transactionRef = transactionRef;
    }
    
    public String getTransactionId() {
        return transactionId;
    }
    
    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }
    
    public String getUserEmail() {
        return userEmail;
    }
    
    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }
    
    public Long getEstablishmentId() {
        return establishmentId;
    }
    
    public void setEstablishmentId(Long establishmentId) {
        this.establishmentId = establishmentId;
    }
    
    public BigDecimal getExpectedAmount() {
        return expectedAmount;
    }
    
    public void setExpectedAmount(BigDecimal expectedAmount) {
        this.expectedAmount = expectedAmount;
    }
    
    public String getScreenshotPath() {
        return screenshotPath;
    }
    
    public void setScreenshotPath(String screenshotPath) {
        this.screenshotPath = screenshotPath;
    }
    
    public VerificationStatus getStatus() {
        return status;
    }
    
    public void setStatus(VerificationStatus status) {
        this.status = status;
    }
    
    public String getOwnerNotes() {
        return ownerNotes;
    }
    
    public void setOwnerNotes(String ownerNotes) {
        this.ownerNotes = ownerNotes;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }
    
    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }
    
    public Long getVerifiedBy() {
        return verifiedBy;
    }
    
    public void setVerifiedBy(Long verifiedBy) {
        this.verifiedBy = verifiedBy;
    }
    
    // Enum for verification status
    public enum VerificationStatus {
        PENDING_VERIFICATION,
        APPROVED,
        REJECTED,
        EXPIRED
    }
}