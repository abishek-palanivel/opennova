package com.opennova.service;

import com.opennova.model.EstablishmentRequest;
import com.opennova.model.RequestStatus;
import com.opennova.model.User;
import com.opennova.repository.EstablishmentRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class EstablishmentRequestService {

    @Autowired
    private EstablishmentRequestRepository establishmentRequestRepository;
    
    @Autowired
    private EmailService emailService;

    public EstablishmentRequest createRequest(EstablishmentRequest request) {
        request.setStatus(RequestStatus.PENDING);
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        return establishmentRequestRepository.save(request);
    }

    public List<EstablishmentRequest> getAllRequests() {
        return establishmentRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<EstablishmentRequest> getPendingRequests() {
        return establishmentRequestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.PENDING);
    }

    public List<EstablishmentRequest> getUserRequests(Long userId) {
        return establishmentRequestRepository.findByUser_Id(userId);
    }

    public Optional<EstablishmentRequest> findById(Long id) {
        return establishmentRequestRepository.findById(id);
    }

    public EstablishmentRequest updateStatus(Long id, RequestStatus status, String adminNotes) {
        Optional<EstablishmentRequest> requestOpt = establishmentRequestRepository.findById(id);
        if (requestOpt.isPresent()) {
            EstablishmentRequest request = requestOpt.get();
            request.setStatus(status);
            request.setAdminNotes(adminNotes);
            request.setUpdatedAt(LocalDateTime.now());
            return establishmentRequestRepository.save(request);
        }
        return null;
    }

    public void deleteRequest(Long id) {
        establishmentRequestRepository.deleteById(id);
    }

    public boolean existsByEmailAndStatus(String email, RequestStatus status) {
        return establishmentRequestRepository.existsByEmailAndStatus(email, status);
    }

    public long countPendingRequests() {
        return establishmentRequestRepository.countByStatus(RequestStatus.PENDING);
    }

    public long getTotalRequests() {
        return establishmentRequestRepository.count();
    }

    public List<EstablishmentRequest> getUserRecentRequests(Long userId, int limit) {
        try {
            List<EstablishmentRequest> allRequests = establishmentRequestRepository.findByUser_IdOrderByCreatedAtDesc(userId);
            return allRequests.size() > limit ? allRequests.subList(0, limit) : allRequests;
        } catch (Exception e) {
            System.err.println("Failed to get user recent requests: " + e.getMessage());
            return new java.util.ArrayList<>();
        }
    }

    // Admin methods
    public long getPendingRequestsCount() {
        return establishmentRequestRepository.countByStatus(RequestStatus.PENDING);
    }

    public EstablishmentRequest approveRequest(Long id) {
        try {
            Optional<EstablishmentRequest> requestOpt = establishmentRequestRepository.findById(id);
            if (requestOpt.isPresent()) {
                EstablishmentRequest request = requestOpt.get();
                request.setStatus(RequestStatus.APPROVED);
                request.setUpdatedAt(LocalDateTime.now());
                EstablishmentRequest savedRequest = establishmentRequestRepository.save(request);
                
                // NOTE: Email with credentials is sent by AdminController.approveRequest()
                // No need to send duplicate email here
                System.out.println("✅ Request approved successfully - email will be sent by AdminController");
                
                return savedRequest;
            }
            return null;
        } catch (Exception e) {
            System.err.println("Error approving request: " + e.getMessage());
            return null;
        }
    }

    public EstablishmentRequest rejectRequest(Long id, String reason) {
        try {
            Optional<EstablishmentRequest> requestOpt = establishmentRequestRepository.findById(id);
            if (requestOpt.isPresent()) {
                EstablishmentRequest request = requestOpt.get();
                request.setStatus(RequestStatus.REJECTED);
                request.setAdminNotes(reason);
                request.setUpdatedAt(LocalDateTime.now());
                EstablishmentRequest savedRequest = establishmentRequestRepository.save(request);
                
                // Send rejection email to user
                try {
                    String userEmail = request.getUser().getEmail();
                    String establishmentName = request.getName();
                    emailService.sendEstablishmentRequestRejectionEmail(userEmail, establishmentName, reason);
                } catch (Exception e) {
                    System.err.println("Failed to send rejection email: " + e.getMessage());
                }
                
                return savedRequest;
            }
            return null;
        } catch (Exception e) {
            System.err.println("Error rejecting request: " + e.getMessage());
            return null;
        }
    }
}