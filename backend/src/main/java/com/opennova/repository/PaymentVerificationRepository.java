package com.opennova.repository;

import com.opennova.model.PaymentVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentVerificationRepository extends JpaRepository<PaymentVerification, Long> {
    
    Optional<PaymentVerification> findByTransactionRef(String transactionRef);
    
    Optional<PaymentVerification> findByTransactionId(String transactionId);
    
    List<PaymentVerification> findByEstablishmentIdAndStatus(Long establishmentId, PaymentVerification.VerificationStatus status);
    
    List<PaymentVerification> findByUserEmailAndStatus(String userEmail, PaymentVerification.VerificationStatus status);
    
    @Query("SELECT pv FROM PaymentVerification pv WHERE pv.establishmentId = :establishmentId ORDER BY pv.createdAt DESC")
    List<PaymentVerification> findByEstablishmentIdOrderByCreatedAtDesc(@Param("establishmentId") Long establishmentId);
    
    @Query("SELECT pv FROM PaymentVerification pv WHERE pv.userEmail = :userEmail ORDER BY pv.createdAt DESC")
    List<PaymentVerification> findByUserEmailOrderByCreatedAtDesc(@Param("userEmail") String userEmail);
    
    boolean existsByTransactionId(String transactionId);
}