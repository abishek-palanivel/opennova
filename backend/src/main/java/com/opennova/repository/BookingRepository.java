package com.opennova.repository;

import com.opennova.model.Booking;
import com.opennova.model.Establishment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    List<Booking> findByEstablishmentInOrderByCreatedAtDesc(List<Establishment> establishments);
    
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.establishment ORDER BY b.createdAt DESC")
    List<Booking> findAllByOrderByCreatedAtDesc();
    
    long countByStatus(com.opennova.model.BookingStatus status);
    
    @Query("SELECT SUM(b.paymentAmount) FROM Booking b WHERE b.status = :status")
    java.math.BigDecimal sumPaidAmountByStatus(@Param("status") com.opennova.model.BookingStatus status);
    
    @Query("SELECT SUM(b.paymentAmount) FROM Booking b WHERE b.paymentStatus = 'PAID'")
    java.math.BigDecimal sumPaidAmountByPaymentStatus();
    
    List<Booking> findByEstablishmentIdAndStatus(Long establishmentId, com.opennova.model.BookingStatus status);
    
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.establishment WHERE b.establishment.owner.id = :ownerId ORDER BY b.createdAt DESC")
    List<Booking> findByEstablishmentOwnerIdOrderByCreatedAtDesc(@Param("ownerId") Long ownerId);
    
    @Query("SELECT b FROM Booking b WHERE b.establishment.id = :establishmentId AND b.visitingTime = :visitingTime")
    List<Booking> findByEstablishmentIdAndVisitingTime(@Param("establishmentId") Long establishmentId, @Param("visitingTime") String visitingTime);
    
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.establishment WHERE b.establishment.id = :establishmentId ORDER BY b.createdAt DESC")
    List<Booking> findByEstablishmentIdOrderByCreatedAtDesc(@Param("establishmentId") Long establishmentId);
    
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.establishment WHERE b.user.id = :userId ORDER BY b.createdAt DESC")
    List<Booking> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
    
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.establishment WHERE b.user.id = :userId ORDER BY b.createdAt DESC LIMIT 10")
    List<Booking> findTop10ByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
    
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.establishment WHERE b.user.id = :userId ORDER BY b.createdAt DESC LIMIT 5")
    List<Booking> findTop5ByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
    
    Booking findByTransactionId(String transactionId);
}