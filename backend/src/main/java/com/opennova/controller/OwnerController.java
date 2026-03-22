package com.opennova.controller;

import com.opennova.model.*;
import com.opennova.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/owner")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class OwnerController {

    @Autowired
    private EstablishmentService establishmentService;

    @Autowired
    private MenuService menuService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private com.opennova.repository.BookingRepository bookingRepository;

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private CollectionService collectionService;

    @Autowired
    private UserService userService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private QRCodeService qrCodeService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PaymentScreenshotService paymentScreenshotService;

    @Autowired
    private ExcelExportService excelExportService;

    @GetMapping("/establishment")
    public ResponseEntity<?> getOwnerEstablishment(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                return ResponseEntity.ok(Map.of("message", "No establishment found"));
            }

            return ResponseEntity.ok(establishments.get(0));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch establishment: " + e.getMessage()));
        }
    }

    @PostMapping("/establishment/profile")
    public ResponseEntity<?> updateEstablishmentProfile(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "upiId", required = false) String upiId,
            @RequestParam(value = "operatingHours", required = false) String operatingHours,
            @RequestParam(value = "upiQrCode", required = false) MultipartFile upiQrCodeFile,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No establishment found"));
            }

            Establishment establishment = establishments.get(0);
            
            // Update basic fields
            if (name != null && !name.trim().isEmpty()) {
                establishment.setName(name);
            }
            if (address != null && !address.trim().isEmpty()) {
                establishment.setAddress(address);
            }
            if (phoneNumber != null && !phoneNumber.trim().isEmpty()) {
                establishment.setPhoneNumber(phoneNumber);
            }
            if (upiId != null && !upiId.trim().isEmpty()) {
                establishment.setUpiId(upiId);
            }
            if (operatingHours != null && !operatingHours.trim().isEmpty()) {
                establishment.setOperatingHours(operatingHours);
            }

            // Handle UPI QR code upload
            if (upiQrCodeFile != null && !upiQrCodeFile.isEmpty()) {
                try {
                    String qrCodePath = fileStorageService.storeFile(upiQrCodeFile, "upi-qr-codes");
                    establishment.setUpiQrCodePath(qrCodePath);
                    System.out.println("✅ UPI QR Code stored: " + qrCodePath);
                } catch (Exception e) {
                    System.err.println("❌ Failed to store UPI QR code: " + e.getMessage());
                    return ResponseEntity.status(500).body(Map.of("error", "Failed to upload UPI QR code: " + e.getMessage()));
                }
            }

            Establishment updatedEstablishment = establishmentService.save(establishment);
            return ResponseEntity.ok(Map.of("data", updatedEstablishment, "message", "Updated successfully"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update: " + e.getMessage()));
        }
    }

    @PutMapping("/establishment/profile")
    public ResponseEntity<?> updateEstablishmentProfilePut(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "upiId", required = false) String upiId,
            @RequestParam(value = "operatingHours", required = false) String operatingHours,
            @RequestParam(value = "upiQrCode", required = false) MultipartFile upiQrCodeFile,
            Authentication authentication) {
        // Use the same logic as POST
        return updateEstablishmentProfile(name, address, phoneNumber, upiId, operatingHours, upiQrCodeFile, authentication);
    }

    @GetMapping("/menus")
    public ResponseEntity<?> getOwnerMenus(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                return ResponseEntity.ok(new ArrayList<>());
            }

            List<Menu> menus = menuService.findByEstablishmentId(establishments.get(0).getId());
            return ResponseEntity.ok(menus);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch menus: " + e.getMessage()));
        }
    }

    @GetMapping("/bookings")
    public ResponseEntity<?> getOwnerBookings(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("bookings", new ArrayList<>());
                response.put("message", "No establishment found");
                return ResponseEntity.ok(response);
            }

            List<Booking> bookings = bookingService.findByEstablishmentId(establishments.get(0).getId());
            
            // Convert bookings to proper format for frontend
            List<Map<String, Object>> bookingList = new ArrayList<>();
            for (Booking booking : bookings) {
                Map<String, Object> bookingData = new HashMap<>();
                bookingData.put("id", booking.getId());
                bookingData.put("customerName", booking.getUser() != null ? booking.getUser().getName() : "Guest");
                bookingData.put("customerEmail", booking.getUserEmail());
                bookingData.put("visitingDate", booking.getVisitingDate());
                bookingData.put("visitingTime", booking.getVisitingTime());
                bookingData.put("amount", booking.getAmount() != null ? booking.getAmount().doubleValue() : 0.0);
                bookingData.put("paymentAmount", booking.getPaymentAmount() != null ? booking.getPaymentAmount().doubleValue() : 
                    (booking.getAmount() != null && (booking.getStatus() == BookingStatus.CONFIRMED || booking.getStatus() == BookingStatus.COMPLETED) ? 
                     booking.getAmount().doubleValue() * 0.7 : 0.0));
                bookingData.put("totalAmount", booking.getAmount() != null ? booking.getAmount().doubleValue() : 0.0);
                bookingData.put("paidAmount", booking.getPaymentAmount() != null ? booking.getPaymentAmount().doubleValue() : 
                    (booking.getAmount() != null && (booking.getStatus() == BookingStatus.CONFIRMED || booking.getStatus() == BookingStatus.COMPLETED) ? 
                     booking.getAmount().doubleValue() * 0.7 : 0.0));
                bookingData.put("status", booking.getStatus().toString());
                bookingData.put("paymentStatus", booking.getPaymentStatus() != null ? booking.getPaymentStatus().toString() : "PENDING");
                bookingData.put("transactionId", booking.getTransactionId());
                bookingData.put("qrCode", booking.getQrCode());
                bookingData.put("selectedItems", booking.getSelectedItems());
                bookingData.put("createdAt", booking.getCreatedAt());
                bookingData.put("confirmedAt", booking.getConfirmedAt());
                bookingData.put("cancelledAt", booking.getCancelledAt());
                bookingData.put("cancellationReason", booking.getCancellationReason());
                bookingData.put("refundStatus", booking.getRefundStatus() != null ? booking.getRefundStatus().toString() : "NOT_APPLICABLE");
                
                bookingList.add(bookingData);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("bookings", bookingList);
            response.put("message", "Bookings fetched successfully");
            
            System.out.println("✅ Returning " + bookingList.size() + " formatted bookings to frontend");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch bookings: " + e.getMessage());
            response.put("bookings", new ArrayList<>());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/reviews")
    public ResponseEntity<?> getOwnerReviews(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                return ResponseEntity.ok(new ArrayList<>());
            }

            List<Review> reviews = reviewService.findByEstablishmentId(establishments.get(0).getId());
            return ResponseEntity.ok(reviews);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch reviews: " + e.getMessage()));
        }
    }

    @GetMapping("/visit-stats")
    public ResponseEntity<?> getVisitStats(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                // Return zeros for owners without establishments
                Map<String, Object> stats = new HashMap<>();
                stats.put("totalBookings", 0);
                stats.put("confirmedBookings", 0);
                stats.put("completedVisits", 0);
                stats.put("pendingVisits", 0);
                stats.put("totalRevenue", 0.0);
                stats.put("visitCompletionRate", 0.0);
                return ResponseEntity.ok(stats);
            }

            Establishment establishment = establishments.get(0);
            
            // Get all bookings for this establishment
            List<Booking> allBookings = bookingRepository.findByEstablishmentIdOrderByCreatedAtDesc(establishment.getId());
            
            // Calculate statistics
            long totalBookings = allBookings.size();
            
            // Count confirmed bookings (paid orders)
            long confirmedBookings = allBookings.stream()
                .filter(b -> (b.getPaymentStatus() == com.opennova.model.PaymentStatus.PAID) ||
                           (b.getStatus() == com.opennova.model.BookingStatus.CONFIRMED) ||
                           (b.getStatus() == com.opennova.model.BookingStatus.COMPLETED))
                .count();
            
            // Count completed visits
            long completedVisits = allBookings.stream()
                .filter(b -> b.getStatus() == com.opennova.model.BookingStatus.COMPLETED)
                .count();
            
            // Count pending visits
            long pendingVisits = allBookings.stream()
                .filter(b -> b.getStatus() == com.opennova.model.BookingStatus.CONFIRMED || 
                           b.getStatus() == com.opennova.model.BookingStatus.PENDING)
                .count();
            
            // Calculate total revenue from payment amounts
            double totalRevenue = allBookings.stream()
                .filter(b -> (b.getPaymentStatus() == com.opennova.model.PaymentStatus.PAID) ||
                           (b.getStatus() == com.opennova.model.BookingStatus.CONFIRMED) ||
                           (b.getStatus() == com.opennova.model.BookingStatus.COMPLETED))
                .mapToDouble(b -> {
                    if (b.getPaymentAmount() != null && b.getPaymentAmount().doubleValue() > 0) {
                        return b.getPaymentAmount().doubleValue();
                    } else if (b.getAmount() != null && b.getAmount().doubleValue() > 0) {
                        if (b.getStatus() == com.opennova.model.BookingStatus.CONFIRMED || 
                            b.getStatus() == com.opennova.model.BookingStatus.COMPLETED) {
                            return b.getAmount().doubleValue() * 0.7; // 70% payment
                        }
                        return b.getAmount().doubleValue();
                    }
                    return 0.0;
                })
                .sum();
            
            // Calculate visit completion rate
            double visitCompletionRate = totalBookings > 0 ? 
                (double) completedVisits / totalBookings * 100.0 : 0.0;
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalBookings", totalBookings);
            stats.put("confirmedBookings", confirmedBookings);
            stats.put("completedVisits", completedVisits);
            stats.put("pendingVisits", pendingVisits);
            stats.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);
            stats.put("visitCompletionRate", Math.round(visitCompletionRate * 10.0) / 10.0);
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch stats: " + e.getMessage()));
        }
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                // Return zeros for owners without establishments
                Map<String, Object> stats = new HashMap<>();
                stats.put("totalBookings", 0);
                stats.put("paidOrders", 0);
                stats.put("pendingVisits", 0);
                stats.put("totalRevenue", 0.0);
                stats.put("todayBookings", 0);
                stats.put("averageRating", 0.0);
                return ResponseEntity.ok(stats);
            }

            Establishment establishment = establishments.get(0);
            
            System.out.println("📊 Calculating dashboard stats for establishment: " + establishment.getName() + " (ID: " + establishment.getId() + ")");
            
            // Get all bookings for this establishment using the repository method directly
            List<Booking> allBookings = bookingRepository.findByEstablishmentIdOrderByCreatedAtDesc(establishment.getId());
            
            System.out.println("📊 Found " + allBookings.size() + " total bookings for establishment");
            
            // Debug: Print first few bookings
            allBookings.stream().limit(3).forEach(b -> 
                System.out.println("📊 Sample booking: ID=" + b.getId() + 
                    ", Status=" + b.getStatus() + 
                    ", PaymentStatus=" + b.getPaymentStatus() + 
                    ", TotalAmount=" + b.getAmount() + 
                    ", PaidAmount=" + b.getPaymentAmount())
            );
            
            // Calculate statistics
            long totalBookings = allBookings.size();
            
            // Count paid orders - check both payment status and booking status
            long paidOrders = allBookings.stream()
                .filter(b -> {
                    boolean isPaid = (b.getPaymentStatus() == com.opennova.model.PaymentStatus.PAID) ||
                                   (b.getStatus() == com.opennova.model.BookingStatus.CONFIRMED) ||
                                   (b.getStatus() == com.opennova.model.BookingStatus.COMPLETED);
                    if (isPaid) {
                        System.out.println("📊 Paid booking found: ID=" + b.getId() + ", PaymentStatus=" + b.getPaymentStatus() + ", Status=" + b.getStatus());
                    }
                    return isPaid;
                })
                .count();
            
            long pendingVisits = allBookings.stream()
                .filter(b -> b.getStatus() == com.opennova.model.BookingStatus.CONFIRMED || 
                           b.getStatus() == com.opennova.model.BookingStatus.PENDING)
                .count();
            
            // Calculate total revenue from payment amounts
            double totalRevenue = allBookings.stream()
                .filter(b -> {
                    // Include revenue from paid bookings
                    boolean isPaidStatus = (b.getPaymentStatus() == com.opennova.model.PaymentStatus.PAID) ||
                                         (b.getStatus() == com.opennova.model.BookingStatus.CONFIRMED) ||
                                         (b.getStatus() == com.opennova.model.BookingStatus.COMPLETED);
                    return isPaidStatus;
                })
                .peek(b -> System.out.println("📊 Revenue booking: ID=" + b.getId() + 
                    ", PaymentAmount=" + b.getPaymentAmount() + 
                    ", TotalAmount=" + b.getAmount() + 
                    ", Status=" + b.getStatus() + 
                    ", PaymentStatus=" + b.getPaymentStatus()))
                .mapToDouble(b -> {
                    // Use payment amount if available, otherwise use total amount
                    if (b.getPaymentAmount() != null && b.getPaymentAmount().doubleValue() > 0) {
                        return b.getPaymentAmount().doubleValue();
                    } else if (b.getAmount() != null && b.getAmount().doubleValue() > 0) {
                        // For confirmed bookings without payment amount, calculate 70% of total
                        if (b.getStatus() == com.opennova.model.BookingStatus.CONFIRMED || 
                            b.getStatus() == com.opennova.model.BookingStatus.COMPLETED) {
                            return b.getAmount().doubleValue() * 0.7; // 70% payment
                        }
                        return b.getAmount().doubleValue();
                    }
                    return 0.0;
                })
                .sum();
            
            // Today's bookings
            LocalDate today = LocalDate.now();
            long todayBookings = allBookings.stream()
                .filter(b -> b.getCreatedAt().toLocalDate().equals(today))
                .count();
            
            // Average rating (if reviews exist)
            double averageRating = 0.0;
            try {
                List<Review> reviews = reviewService.getEstablishmentReviews(establishment.getId());
                if (!reviews.isEmpty()) {
                    averageRating = reviews.stream()
                        .filter(r -> r.getStatus() == com.opennova.model.ReviewStatus.APPROVED)
                        .mapToInt(Review::getRating)
                        .average()
                        .orElse(0.0);
                }
            } catch (Exception e) {
                System.err.println("Error calculating average rating: " + e.getMessage());
            }
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalBookings", totalBookings);
            stats.put("paidOrders", paidOrders);
            stats.put("pendingVisits", pendingVisits);
            stats.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0); // Round to 2 decimal places
            stats.put("todayBookings", todayBookings);
            stats.put("averageRating", Math.round(averageRating * 10.0) / 10.0); // Round to 1 decimal place
            
            System.out.println("📊 Final dashboard stats for " + establishment.getName() + ": " + stats);
            
            // Add establishment info for debugging
            stats.put("establishmentId", establishment.getId());
            stats.put("establishmentName", establishment.getName());
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch dashboard stats: " + e.getMessage()));
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getOrders(Authentication authentication) {
        try {
            // Get authenticated user
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            System.out.println("📦 Fetching orders for user: " + user.getEmail());
            
            // Get user's establishment
            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            if (establishments.isEmpty()) {
                System.err.println("❌ No establishment found for owner: " + user.getEmail());
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "No establishment found for this owner");
                response.put("orders", new ArrayList<>());
                response.put("totalOrders", 0);
                return ResponseEntity.ok(response);
            }
            
            Establishment establishment = establishments.get(0);
            
            System.out.println("🏨 Found establishment: " + establishment.getName() + " (ID: " + establishment.getId() + ", Type: " + establishment.getType() + ")");
            
            // Get all bookings for this establishment
            List<Booking> allBookings = bookingService.getBookingsByEstablishmentId(establishment.getId());
            
            // Show all bookings (not just confirmed ones) so owners can manage all orders
            List<Booking> orders = allBookings.stream()
                .filter(booking -> booking.getStatus() != null) // Just filter out null status
                .collect(Collectors.toList());
            
            System.out.println("📦 Found " + orders.size() + " total bookings for " + establishment.getType());
            
            // Convert to response format with establishment type-specific handling
            List<Map<String, Object>> orderList = new ArrayList<>();
            for (Booking order : orders) {
                Map<String, Object> orderData = new HashMap<>();
                orderData.put("id", order.getId());
                orderData.put("customerName", order.getUser() != null ? order.getUser().getName() : "Guest");
                orderData.put("customerEmail", order.getUserEmail());
                orderData.put("visitingDate", order.getVisitingDate());
                orderData.put("visitingTime", order.getVisitingTime());
                orderData.put("amount", order.getAmount() != null ? order.getAmount().doubleValue() : 0.0);
                orderData.put("paymentAmount", order.getPaymentAmount() != null ? order.getPaymentAmount().doubleValue() : 
                    (order.getAmount() != null && (order.getStatus() == BookingStatus.CONFIRMED || order.getStatus() == BookingStatus.COMPLETED) ? 
                     order.getAmount().doubleValue() * 0.7 : 0.0));
                orderData.put("totalAmount", order.getAmount() != null ? order.getAmount().doubleValue() : 0.0);
                orderData.put("paidAmount", order.getPaymentAmount() != null ? order.getPaymentAmount().doubleValue() : 
                    (order.getAmount() != null && (order.getStatus() == BookingStatus.CONFIRMED || order.getStatus() == BookingStatus.COMPLETED) ? 
                     order.getAmount().doubleValue() * 0.7 : 0.0));
                orderData.put("status", order.getStatus().toString());
                orderData.put("paymentStatus", order.getPaymentStatus().toString());
                orderData.put("transactionId", order.getTransactionId());
                orderData.put("createdAt", order.getCreatedAt());
                orderData.put("confirmedAt", order.getConfirmedAt());
                orderData.put("qrCode", order.getQrCode());
                
                // Handle different establishment types
                String establishmentType = establishment.getType() != null ? establishment.getType().toString() : "UNKNOWN";
                orderData.put("establishmentType", establishmentType);
                
                // Parse and format selected items based on establishment type
                String itemsDisplay = "No items selected";
                try {
                    if (order.getSelectedItems() != null && !order.getSelectedItems().trim().isEmpty()) {
                        switch (establishmentType) {
                            case "HOTEL":
                                itemsDisplay = formatHotelItems(order.getSelectedItems());
                                break;
                            case "HOSPITAL":
                                itemsDisplay = formatHospitalItems(order.getSelectedItems());
                                break;
                            case "SHOP":
                                itemsDisplay = formatShopItems(order.getSelectedItems());
                                break;
                            default:
                                itemsDisplay = order.getSelectedItems();
                        }
                    }
                } catch (Exception e) {
                    System.err.println("❌ Error formatting items for " + establishmentType + ": " + e.getMessage());
                    itemsDisplay = "Items data unavailable";
                }
                
                orderData.put("selectedItems", order.getSelectedItems());
                orderData.put("itemsDisplay", itemsDisplay);
                orderData.put("itemDetails", order.getItemDetails());
                
                orderList.add(orderData);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("orders", orderList);
            response.put("totalOrders", orderList.size());
            response.put("establishmentType", establishment.getType());
            response.put("establishmentName", establishment.getName());
            
            System.out.println("✅ Returning " + orderList.size() + " orders for " + establishment.getType() + " to frontend");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to fetch orders: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch orders: " + e.getMessage());
            response.put("orders", new ArrayList<>());
            response.put("totalOrders", 0);
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * Format hotel menu items for display
     */
    private String formatHotelItems(String selectedItems) {
        try {
            // Parse JSON array of selected menu items
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.List<Map<String, Object>> items = mapper.readValue(selectedItems, java.util.List.class);
            
            return items.stream()
                .map(item -> {
                    String name = (String) item.get("name");
                    Object priceObj = item.get("price");
                    String price = priceObj != null ? "₹" + priceObj.toString() : "";
                    Object quantityObj = item.get("quantity");
                    String quantity = quantityObj != null ? " x" + quantityObj.toString() : "";
                    return name + price + quantity;
                })
                .collect(Collectors.joining(", "));
        } catch (Exception e) {
            return selectedItems; // Return raw data if parsing fails
        }
    }
    
    /**
     * Format hospital appointment items for display
     */
    private String formatHospitalItems(String selectedItems) {
        try {
            // Parse JSON array of selected doctors/services
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.List<Map<String, Object>> items = mapper.readValue(selectedItems, java.util.List.class);
            
            return items.stream()
                .map(item -> {
                    String doctorName = (String) item.get("doctorName");
                    String specialization = (String) item.get("specialization");
                    Object feeObj = item.get("consultationFee");
                    String fee = feeObj != null ? " - ₹" + feeObj.toString() : "";
                    
                    if (doctorName != null) {
                        return "Dr. " + doctorName + (specialization != null ? " (" + specialization + ")" : "") + fee;
                    } else {
                        String serviceName = (String) item.get("name");
                        return serviceName != null ? serviceName + fee : "Medical Service" + fee;
                    }
                })
                .collect(Collectors.joining(", "));
        } catch (Exception e) {
            return selectedItems; // Return raw data if parsing fails
        }
    }
    
    /**
     * Format shop collection items for display
     */
    private String formatShopItems(String selectedItems) {
        try {
            // Parse JSON array of selected collection items
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.List<Map<String, Object>> items = mapper.readValue(selectedItems, java.util.List.class);
            
            return items.stream()
                .map(item -> {
                    String itemName = (String) item.get("itemName");
                    String brand = (String) item.get("brand");
                    Object priceObj = item.get("price");
                    String price = priceObj != null ? " - ₹" + priceObj.toString() : "";
                    Object quantityObj = item.get("quantity");
                    String quantity = quantityObj != null ? " x" + quantityObj.toString() : "";
                    
                    String displayName = itemName != null ? itemName : "Item";
                    if (brand != null && !brand.trim().isEmpty()) {
                        displayName += " (" + brand + ")";
                    }
                    return displayName + price + quantity;
                })
                .collect(Collectors.joining(", "));
        } catch (Exception e) {
            return selectedItems; // Return raw data if parsing fails
        }
    }

    @GetMapping("/reviews/pending")
    public ResponseEntity<?> getPendingReviews(Authentication authentication) {
        try {
            // Return empty list - pending reviews section is removed as requested
            return ResponseEntity.ok(new ArrayList<>());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch pending reviews: " + e.getMessage()));
        }
    }

    @GetMapping("/collections")
    public ResponseEntity<?> getCollections(Authentication authentication) {
        try {
            return ResponseEntity.ok(new ArrayList<>());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch collections: " + e.getMessage()));
        }
    }

    @GetMapping("/doctors")
    public ResponseEntity<?> getDoctors(Authentication authentication) {
        try {
            return ResponseEntity.ok(new ArrayList<>());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch doctors: " + e.getMessage()));
        }
    }

    @PostMapping("/bookings/{bookingId}/confirm")
    public ResponseEntity<?> confirmBooking(@PathVariable Long bookingId, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No establishment found"));
            }

            Establishment establishment = establishments.get(0);
            
            // Confirm the booking
            Booking confirmedBooking = bookingService.confirmBooking(bookingId, establishment.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Booking confirmed successfully");
            response.put("booking", confirmedBooking);
            response.put("qrCode", confirmedBooking.getQrCode());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Failed to confirm booking: " + e.getMessage()));
        }
    }

    @PostMapping("/bookings/{bookingId}/reject")
    public ResponseEntity<?> rejectBooking(@PathVariable Long bookingId, @RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No establishment found"));
            }

            Establishment establishment = establishments.get(0);
            String reason = request.get("reason");
            
            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Rejection reason is required"));
            }
            
            // Cancel the booking with reason
            Booking cancelledBooking = bookingService.ownerCancelBooking(bookingId, user.getId(), reason);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Booking rejected successfully");
            response.put("booking", cancelledBooking);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Failed to reject booking: " + e.getMessage()));
        }
    }

    @DeleteMapping("/bookings/{bookingId}")
    public ResponseEntity<?> deleteBooking(@PathVariable Long bookingId, Authentication authentication) {
        try {
            System.out.println("🗑️ Delete booking request received for ID: " + bookingId);
            
            String email = authentication.getName();
            System.out.println("🗑️ User email: " + email);
            
            User user = userService.findByEmailSafe(email);
            
            if (user == null) {
                System.err.println("❌ User not found: " + email);
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                System.err.println("❌ No establishment found for user: " + email);
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No establishment found"));
            }

            Establishment establishment = establishments.get(0);
            System.out.println("🗑️ Found establishment: " + establishment.getName() + " (ID: " + establishment.getId() + ")");
            
            // Delete the booking
            bookingService.deleteBooking(bookingId, establishment.getId());
            System.out.println("✅ Booking deleted successfully: " + bookingId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Booking deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Error deleting booking " + bookingId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Failed to delete booking: " + e.getMessage()));
        }
    }

    @PutMapping("/establishment/status")
    public ResponseEntity<?> updateEstablishmentStatus(@RequestBody Map<String, Object> statusData, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No establishment found"));
            }

            Establishment establishment = establishments.get(0);
            
            if (statusData.containsKey("isActive")) {
                Boolean newStatus = (Boolean) statusData.get("isActive");
                establishment.setIsActive(newStatus);
            }

            Establishment updatedEstablishment = establishmentService.save(establishment);
            return ResponseEntity.ok(updatedEstablishment);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update status: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/establishment/schedule", method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> saveSchedule(@RequestBody Map<String, Object> scheduleData, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No establishment found"));
            }

            Establishment establishment = establishments.get(0);
            
            System.out.println("📅 Saving schedule for establishment: " + establishment.getName());
            System.out.println("📅 Schedule data received: " + scheduleData);
            
            // Convert schedule data to JSON string
            String scheduleJson = null;
            if (scheduleData != null && !scheduleData.isEmpty()) {
                try {
                    // Convert the schedule map to JSON string
                    scheduleJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(scheduleData);
                    System.out.println("📅 Schedule JSON: " + scheduleJson);
                } catch (Exception e) {
                    System.err.println("Failed to serialize schedule data: " + e.getMessage());
                    scheduleJson = scheduleData.toString(); // Fallback
                }
            }
            
            // Update schedule using EstablishmentService
            Establishment updatedEstablishment = establishmentService.updateWeeklySchedule(
                establishment.getId(), scheduleJson);
            
            if (updatedEstablishment != null) {
                System.out.println("✅ Schedule updated successfully for establishment: " + establishment.getName());
                System.out.println("✅ Saved schedule: " + updatedEstablishment.getWeeklySchedule());
                return ResponseEntity.ok(Map.of(
                    "message", "Schedule saved successfully",
                    "schedule", updatedEstablishment.getWeeklySchedule() != null ? updatedEstablishment.getWeeklySchedule() : "null"
                ));
            } else {
                System.err.println("❌ Failed to save schedule - updateWeeklySchedule returned null");
                return ResponseEntity.status(500).body(Map.of("error", "Failed to save schedule"));
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to save schedule: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/establishment/location", method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> updateLocation(@RequestBody Map<String, Object> locationData, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No establishment found"));
            }

            Establishment establishment = establishments.get(0);
            
            System.out.println("📍 Updating location for establishment: " + establishment.getName());
            System.out.println("📍 Location data received: " + locationData);
            
            // Extract location data
            Double latitude = null;
            Double longitude = null;
            String address = null;
            
            if (locationData.get("latitude") != null) {
                try {
                    latitude = Double.valueOf(locationData.get("latitude").toString());
                    System.out.println("📍 Parsed latitude: " + latitude);
                } catch (Exception e) {
                    System.err.println("❌ Failed to parse latitude: " + locationData.get("latitude"));
                }
            }
            if (locationData.get("longitude") != null) {
                try {
                    longitude = Double.valueOf(locationData.get("longitude").toString());
                    System.out.println("📍 Parsed longitude: " + longitude);
                } catch (Exception e) {
                    System.err.println("❌ Failed to parse longitude: " + locationData.get("longitude"));
                }
            }
            if (locationData.get("address") != null) {
                address = locationData.get("address").toString();
                System.out.println("📍 Address: " + address);
            }
            
            // Update location using EstablishmentService
            Establishment updatedEstablishment = establishmentService.updateLocation(
                establishment.getId(), latitude, longitude, address);
            
            if (updatedEstablishment != null) {
                System.out.println("✅ Location updated successfully for establishment: " + establishment.getName());
                System.out.println("✅ New coordinates: " + updatedEstablishment.getLatitude() + ", " + updatedEstablishment.getLongitude());
                return ResponseEntity.ok(Map.of(
                    "message", "Location updated successfully",
                    "latitude", updatedEstablishment.getLatitude() != null ? updatedEstablishment.getLatitude() : "null",
                    "longitude", updatedEstablishment.getLongitude() != null ? updatedEstablishment.getLongitude() : "null",
                    "address", updatedEstablishment.getAddress() != null ? updatedEstablishment.getAddress() : "null"
                ));
            } else {
                System.err.println("❌ Failed to update location - updateLocation returned null");
                return ResponseEntity.status(500).body(Map.of("error", "Failed to update location"));
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update location: " + e.getMessage()));
        }
    }

    @DeleteMapping("/establishment")
    public ResponseEntity<?> deleteEstablishment(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No establishment found"));
            }

            Establishment establishment = establishments.get(0);
            
            System.out.println("🗑️ Owner requesting deletion of establishment: " + establishment.getName());
            
            // Use the same cascade delete method as admin
            boolean deleted = establishmentService.deleteEstablishmentWithCascade(establishment.getId());
            
            if (deleted) {
                System.out.println("✅ Establishment deleted successfully by owner: " + establishment.getName());
                return ResponseEntity.ok(Map.of(
                    "message", "Establishment deleted successfully",
                    "establishmentName", establishment.getName()
                ));
            } else {
                return ResponseEntity.status(500).body(Map.of("error", "Failed to delete establishment"));
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete establishment: " + e.getMessage()));
        }
    }

    @PostMapping("/doctors/with-image")
    public ResponseEntity<?> saveDoctorWithImage(
            @RequestParam("name") String name,
            @RequestParam("specialization") String specialization,
            @RequestParam(value = "experience", defaultValue = "0") String experience,
            @RequestParam(value = "consultationFee", defaultValue = "0") String consultationFee,
            @RequestParam(value = "availableTime", defaultValue = "9:00 AM - 5:00 PM") String availableTime,
            @RequestParam(value = "qualification", defaultValue = "") String qualification,
            @RequestParam(value = "image", required = false) MultipartFile imageFile,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No establishment found"));
            }

            Establishment establishment = establishments.get(0);
            
            // Create new doctor
            Map<String, Object> doctorData = new HashMap<>();
            doctorData.put("id", System.currentTimeMillis());
            doctorData.put("name", name);
            doctorData.put("specialization", specialization);
            doctorData.put("experience", Integer.parseInt(experience));
            doctorData.put("consultationFee", new BigDecimal(consultationFee));
            doctorData.put("availableTime", availableTime);
            doctorData.put("qualification", qualification);
            doctorData.put("establishmentId", establishment.getId());
            doctorData.put("isAvailable", true);
            
            // Handle image upload
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    String imagePath = fileStorageService.storeFile(imageFile, "doctor-images");
                    doctorData.put("imagePath", imagePath);
                    System.out.println("✅ Doctor image stored: " + imagePath);
                } catch (Exception e) {
                    System.err.println("❌ Failed to store doctor image: " + e.getMessage());
                    // Continue without image
                }
            }
            
            doctorData.put("message", "Doctor saved successfully");
            return ResponseEntity.ok(doctorData);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to save doctor: " + e.getMessage()));
        }
    }

    @PutMapping("/doctors/{id}")
    public ResponseEntity<?> updateDoctor(@PathVariable Long id, @RequestParam Map<String, String> doctorData, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Doctor doctor = doctorService.getDoctorById(id);
            if (doctor == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Doctor not found"));
            }

            // Update doctor fields using correct method names
            if (doctorData.containsKey("name")) {
                doctor.setName(doctorData.get("name"));
            }
            if (doctorData.containsKey("specialization")) {
                doctor.setSpecialization(doctorData.get("specialization"));
            }
            if (doctorData.containsKey("consultationFee")) {
                doctor.setPrice(new BigDecimal(doctorData.get("consultationFee")));
            }
            if (doctorData.containsKey("availableTime")) {
                doctor.setAvailabilityTime(doctorData.get("availableTime"));
            }

            Doctor updatedDoctor = doctorService.save(doctor);
            return ResponseEntity.ok(Map.of("data", updatedDoctor, "message", "Doctor updated successfully"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update doctor: " + e.getMessage()));
        }
    }

    @PutMapping("/doctors/{id}/with-image")
    public ResponseEntity<?> updateDoctorWithImage(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("specialization") String specialization,
            @RequestParam(value = "experience", defaultValue = "0") String experience,
            @RequestParam(value = "consultationFee", defaultValue = "0") String consultationFee,
            @RequestParam(value = "availableTime", defaultValue = "9:00 AM - 5:00 PM") String availableTime,
            @RequestParam(value = "qualification", defaultValue = "") String qualification,
            @RequestParam(value = "image", required = false) MultipartFile imageFile,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Doctor doctor = doctorService.getDoctorById(id);
            if (doctor == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Doctor not found"));
            }

            // Update doctor fields using correct method names
            doctor.setName(name);
            doctor.setSpecialization(specialization);
            doctor.setPrice(new BigDecimal(consultationFee));
            doctor.setAvailabilityTime(availableTime);
            
            // Handle image upload if provided
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    String imagePath = fileStorageService.storeFile(imageFile, "doctor-images");
                    doctor.setImagePath(imagePath);
                    System.out.println("✅ Doctor image updated: " + imagePath);
                } catch (Exception e) {
                    System.err.println("❌ Failed to update doctor image: " + e.getMessage());
                    // Continue without updating image
                }
            }
            
            Doctor updatedDoctor = doctorService.save(doctor);
            return ResponseEntity.ok(Map.of("data", updatedDoctor, "message", "Doctor updated successfully"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update doctor: " + e.getMessage()));
        }
    }

    @DeleteMapping("/doctors/{id}")
    public ResponseEntity<?> deleteDoctor(@PathVariable Long id, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No establishment found"));
            }

            Establishment establishment = establishments.get(0);
            doctorService.deleteDoctor(id, establishment.getId());
            return ResponseEntity.ok(Map.of("message", "Doctor deleted successfully"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete doctor: " + e.getMessage()));
        }
    }

    // Menu Management Endpoints
    @PostMapping("/menus/with-image")
    public ResponseEntity<?> saveMenuWithImage(
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("price") String price,
            @RequestParam("category") String category,
            @RequestParam(value = "preparationTime", defaultValue = "15") String preparationTime,
            @RequestParam(value = "availabilityTime", defaultValue = "9:00 AM - 10:00 PM") String availabilityTime,
            @RequestParam(value = "image", required = false) MultipartFile imageFile,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No establishment found"));
            }

            Establishment establishment = establishments.get(0);
            
            // Create new menu item
            Menu menu = new Menu();
            menu.setName(name);
            menu.setDescription(description);
            menu.setPrice(new BigDecimal(price));
            menu.setCategory(category);
            menu.setPreparationTime(Integer.parseInt(preparationTime));
            menu.setAvailabilityTime(availabilityTime);
            menu.setEstablishmentId(establishment.getId());
            menu.setIsAvailable(true);
            
            // Handle image upload
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    String imagePath = fileStorageService.storeFile(imageFile, "menu-images");
                    menu.setImagePath(imagePath);
                    System.out.println("✅ Menu image stored: " + imagePath);
                } catch (Exception e) {
                    System.err.println("❌ Failed to store menu image: " + e.getMessage());
                    // Continue without image
                }
            }
            
            Menu savedMenu = menuService.save(menu);
            return ResponseEntity.ok(Map.of("data", savedMenu, "message", "Menu item saved successfully"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to save menu: " + e.getMessage()));
        }
    }

    @PutMapping("/menus/{id}")
    public ResponseEntity<?> updateMenu(@PathVariable Long id, @RequestParam Map<String, String> menuData, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Menu menu = menuService.findById(id).orElse(null);
            if (menu == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Menu item not found"));
            }

            // Update menu fields
            if (menuData.containsKey("name")) {
                menu.setName(menuData.get("name"));
            }
            if (menuData.containsKey("description")) {
                menu.setDescription(menuData.get("description"));
            }
            if (menuData.containsKey("price")) {
                menu.setPrice(new BigDecimal(menuData.get("price")));
            }
            if (menuData.containsKey("category")) {
                menu.setCategory(menuData.get("category"));
            }
            if (menuData.containsKey("preparationTime")) {
                menu.setPreparationTime(Integer.parseInt(menuData.get("preparationTime")));
            }
            if (menuData.containsKey("availabilityTime")) {
                menu.setAvailabilityTime(menuData.get("availabilityTime"));
            }

            Menu updatedMenu = menuService.save(menu);
            return ResponseEntity.ok(Map.of("data", updatedMenu, "message", "Menu item updated successfully"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update menu: " + e.getMessage()));
        }
    }

    @PutMapping("/menus/{id}/with-image")
    public ResponseEntity<?> updateMenuWithImage(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("price") String price,
            @RequestParam("category") String category,
            @RequestParam(value = "preparationTime", defaultValue = "15") String preparationTime,
            @RequestParam(value = "availabilityTime", defaultValue = "9:00 AM - 10:00 PM") String availabilityTime,
            @RequestParam(value = "image", required = false) MultipartFile imageFile,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Menu menu = menuService.findById(id).orElse(null);
            if (menu == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Menu item not found"));
            }

            // Update menu fields
            menu.setName(name);
            menu.setDescription(description);
            menu.setPrice(new BigDecimal(price));
            menu.setCategory(category);
            menu.setPreparationTime(Integer.parseInt(preparationTime));
            menu.setAvailabilityTime(availabilityTime);
            
            // Handle image upload if provided
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    String imagePath = fileStorageService.storeFile(imageFile, "menu-images");
                    menu.setImagePath(imagePath);
                    System.out.println("✅ Menu image updated: " + imagePath);
                } catch (Exception e) {
                    System.err.println("❌ Failed to update menu image: " + e.getMessage());
                    // Continue without updating image
                }
            }
            
            Menu updatedMenu = menuService.save(menu);
            return ResponseEntity.ok(Map.of("data", updatedMenu, "message", "Menu item updated successfully"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update menu: " + e.getMessage()));
        }
    }

    @DeleteMapping("/menus/{id}")
    public ResponseEntity<?> deleteMenu(@PathVariable Long id, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Menu menu = menuService.findById(id).orElse(null);
            if (menu == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Menu item not found"));
            }

            menuService.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Menu item deleted successfully"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete menu: " + e.getMessage()));
        }
    }

    // Collection Management Endpoints (for shops)
    @PostMapping("/collections/with-image")
    public ResponseEntity<?> saveCollectionWithImage(
            @RequestParam("itemName") String itemName,
            @RequestParam("description") String description,
            @RequestParam("price") String price,
            @RequestParam(value = "brand", defaultValue = "") String brand,
            @RequestParam(value = "colors", defaultValue = "") String colors,
            @RequestParam(value = "fabric", defaultValue = "") String fabric,
            @RequestParam(value = "sizes", defaultValue = "") String sizes,
            @RequestParam(value = "stock", defaultValue = "1") String stock,
            @RequestParam(value = "image", required = false) MultipartFile imageFile,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No establishment found"));
            }

            Establishment establishment = establishments.get(0);
            
            // Create new collection item
            Map<String, Object> collectionData = new HashMap<>();
            collectionData.put("id", System.currentTimeMillis());
            collectionData.put("itemName", itemName);
            collectionData.put("description", description);
            collectionData.put("price", new BigDecimal(price));
            collectionData.put("brand", brand);
            collectionData.put("colors", colors);
            collectionData.put("fabric", fabric);
            collectionData.put("sizes", sizes);
            collectionData.put("stock", Integer.parseInt(stock));
            collectionData.put("establishmentId", establishment.getId());
            collectionData.put("isAvailable", true);
            
            // Handle image upload
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    String imagePath = fileStorageService.storeFile(imageFile, "collection-images");
                    collectionData.put("imagePath", imagePath);
                    System.out.println("✅ Collection image stored: " + imagePath);
                } catch (Exception e) {
                    System.err.println("❌ Failed to store collection image: " + e.getMessage());
                    // Continue without image
                }
            }
            
            collectionData.put("message", "Collection item saved successfully");
            return ResponseEntity.ok(collectionData);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to save collection: " + e.getMessage()));
        }
    }

    @PutMapping("/collections/{id}")
    public ResponseEntity<?> updateCollection(@PathVariable Long id, @RequestParam Map<String, String> collectionData, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No establishment found"));
            }

            Establishment establishment = establishments.get(0);
            com.opennova.model.Collection collection = collectionService.getCollectionById(id, establishment.getId());
            if (collection == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Collection item not found"));
            }

            // Update collection fields
            if (collectionData.containsKey("itemName")) {
                collection.setItemName(collectionData.get("itemName"));
            }
            if (collectionData.containsKey("description")) {
                collection.setDescription(collectionData.get("description"));
            }
            if (collectionData.containsKey("price")) {
                collection.setPrice(new BigDecimal(collectionData.get("price")));
            }
            if (collectionData.containsKey("brand")) {
                collection.setBrand(collectionData.get("brand"));
            }
            if (collectionData.containsKey("colors")) {
                collection.setColors(collectionData.get("colors"));
            }
            if (collectionData.containsKey("fabric")) {
                collection.setFabric(collectionData.get("fabric"));
            }
            if (collectionData.containsKey("sizes")) {
                collection.setSizes(collectionData.get("sizes"));
            }
            if (collectionData.containsKey("stock")) {
                collection.setStock(Integer.parseInt(collectionData.get("stock")));
            }

            com.opennova.model.Collection updatedCollection = collectionService.save(collection);
            return ResponseEntity.ok(Map.of("data", updatedCollection, "message", "Collection item updated successfully"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update collection: " + e.getMessage()));
        }
    }

    @PutMapping("/collections/{id}/with-image")
    public ResponseEntity<?> updateCollectionWithImage(
            @PathVariable Long id,
            @RequestParam("itemName") String itemName,
            @RequestParam("description") String description,
            @RequestParam("price") String price,
            @RequestParam(value = "brand", defaultValue = "") String brand,
            @RequestParam(value = "colors", defaultValue = "") String colors,
            @RequestParam(value = "fabric", defaultValue = "") String fabric,
            @RequestParam(value = "sizes", defaultValue = "") String sizes,
            @RequestParam(value = "stock", defaultValue = "1") String stock,
            @RequestParam(value = "image", required = false) MultipartFile imageFile,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No establishment found"));
            }

            Establishment establishment = establishments.get(0);
            com.opennova.model.Collection collection = collectionService.getCollectionById(id, establishment.getId());
            if (collection == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Collection item not found"));
            }

            // Update collection fields
            collection.setItemName(itemName);
            collection.setDescription(description);
            collection.setPrice(new BigDecimal(price));
            collection.setBrand(brand);
            collection.setColors(colors);
            collection.setFabric(fabric);
            collection.setSizes(sizes);
            collection.setStock(Integer.parseInt(stock));
            
            // Handle image upload if provided
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    String imagePath = fileStorageService.storeFile(imageFile, "collection-images");
                    collection.setImagePath(imagePath);
                    System.out.println("✅ Collection image updated: " + imagePath);
                } catch (Exception e) {
                    System.err.println("❌ Failed to update collection image: " + e.getMessage());
                    // Continue without updating image
                }
            }
            
            com.opennova.model.Collection updatedCollection = collectionService.save(collection);
            return ResponseEntity.ok(Map.of("data", updatedCollection, "message", "Collection item updated successfully"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update collection: " + e.getMessage()));
        }
    }

    @DeleteMapping("/collections/{id}")
    public ResponseEntity<?> deleteCollection(@PathVariable Long id, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            return ResponseEntity.ok(Map.of("message", "Collection item deleted successfully"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete collection: " + e.getMessage()));
        }
    }

    // Booking Management Endpoints
    @PutMapping("/bookings/{id}/status")
    public ResponseEntity<?> updateBookingStatus(@PathVariable Long id, @RequestBody Map<String, String> statusData, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            Booking booking = bookingService.findById(id);
            if (booking == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
            }

            String newStatus = statusData.get("status");
            String rejectionReason = statusData.get("reason");
            
            if (newStatus != null) {
                BookingStatus status = BookingStatus.valueOf(newStatus.toUpperCase());
                booking.setStatus(status);
                
                // Handle different status updates
                if (status == BookingStatus.CONFIRMED) {
                    // Generate QR code for confirmed booking
                    try {
                        String qrCode = qrCodeService.generateBookingQRCode(booking);
                        booking.setQrCode(qrCode);
                        
                        // Save booking with QR code
                        Booking updatedBooking = bookingService.save(booking);
                        
                        // Send confirmation email with QR code
                        emailService.sendBookingConfirmationWithQR(updatedBooking);
                        
                        System.out.println("✅ Booking confirmed with QR code generated and email sent");
                        return ResponseEntity.ok(Map.of(
                            "data", updatedBooking, 
                            "message", "Booking confirmed successfully. QR code generated and email sent to customer.",
                            "qrCode", qrCode
                        ));
                        
                    } catch (Exception e) {
                        System.err.println("❌ Failed to generate QR code: " + e.getMessage());
                        // Still save the booking as confirmed, but without QR
                        Booking updatedBooking = bookingService.save(booking);
                        emailService.sendBookingConfirmation(updatedBooking);
                        
                        return ResponseEntity.ok(Map.of(
                            "data", updatedBooking, 
                            "message", "Booking confirmed successfully. Email sent to customer.",
                            "warning", "QR code generation failed"
                        ));
                    }
                    
                } else if (status == BookingStatus.CANCELLED) {
                    // Handle booking cancellation/rejection
                    Booking updatedBooking = bookingService.save(booking);
                    
                    // Send rejection email
                    if (rejectionReason != null && !rejectionReason.trim().isEmpty()) {
                        emailService.sendBookingRejectionWithDetails(updatedBooking, rejectionReason);
                    } else {
                        emailService.sendBookingRejection(updatedBooking, "No specific reason provided");
                    }
                    
                    System.out.println("✅ Booking cancelled and email sent");
                    return ResponseEntity.ok(Map.of(
                        "data", updatedBooking, 
                        "message", "Booking cancelled successfully. Email sent to customer."
                    ));
                    
                } else {
                    // For other status updates
                    Booking updatedBooking = bookingService.save(booking);
                    return ResponseEntity.ok(Map.of(
                        "data", updatedBooking, 
                        "message", "Booking status updated successfully"
                    ));
                }
            }

            return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update booking status: " + e.getMessage()));
        }
    }

    // Excel Export Endpoint
    @GetMapping("/bookings/export")
    public ResponseEntity<?> exportBookingsToExcel(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            byte[] excelData = excelExportService.exportBookingsToExcel(user.getId(), "OWNER");
            
            String filename = "bookings_" + user.getId() + "_" + 
                            java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + 
                            ".xlsx";
            
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=" + filename)
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(excelData);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to export bookings: " + e.getMessage()));
        }
    }
    
    /**
     * Get pending payment verifications for owner
     */
    @GetMapping("/payment-verifications")
    public ResponseEntity<?> getPendingPaymentVerifications(Authentication authentication) {
        try {
            // Get authenticated user
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            // Get user's establishment
            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            if (establishments.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "No establishment found for this owner");
                response.put("verifications", new ArrayList<>());
                return ResponseEntity.ok(response);
            }
            
            Establishment establishment = establishments.get(0);
            
            // Get pending verifications
            List<PaymentVerification> verifications = 
                paymentScreenshotService.getPendingVerifications(establishment.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("verifications", verifications);
            response.put("count", verifications.size());
            
            System.out.println("📋 Found " + verifications.size() + " pending payment verifications for establishment: " + establishment.getName());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Get payment verifications error: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get payment verifications: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Approve payment verification
     */
    @PostMapping("/payment-verifications/{verificationId}/approve")
    public ResponseEntity<?> approvePaymentVerification(@PathVariable Long verificationId,
                                                      @RequestBody Map<String, Object> data,
                                                      Authentication authentication) {
        try {
            // Get authenticated user
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            String notes = (String) data.get("notes");
            
            // Approve payment
            PaymentVerification approved = paymentScreenshotService.approvePayment(
                verificationId, user.getId(), notes
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment verification approved successfully");
            response.put("verification", approved);
            
            System.out.println("✅ Payment verification approved: ID " + verificationId + 
                             " by owner: " + user.getEmail());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Approve payment verification error: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to approve payment verification: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Reject payment verification
     */
    @PostMapping("/payment-verifications/{verificationId}/reject")
    public ResponseEntity<?> rejectPaymentVerification(@PathVariable Long verificationId,
                                                     @RequestBody Map<String, Object> data,
                                                     Authentication authentication) {
        try {
            // Get authenticated user
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            String reason = (String) data.get("reason");
            if (reason == null || reason.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Rejection reason is required");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Reject payment
            PaymentVerification rejected = paymentScreenshotService.rejectPayment(
                verificationId, user.getId(), reason
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment verification rejected successfully");
            response.put("verification", rejected);
            
            System.out.println("❌ Payment verification rejected: ID " + verificationId + 
                             " by owner: " + user.getEmail() + " Reason: " + reason);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Reject payment verification error: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to reject payment verification: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Delete payment verification
     */
    @DeleteMapping("/payment-verifications/{verificationId}")
    public ResponseEntity<?> deletePaymentVerification(@PathVariable Long verificationId,
                                                     Authentication authentication) {
        try {
            // Get authenticated user
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            // Delete payment verification
            boolean deleted = paymentScreenshotService.deletePaymentVerification(verificationId, user.getId());
            
            if (deleted) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Payment verification deleted successfully");
                
                System.out.println("🗑️ Payment verification deleted: ID " + verificationId + 
                                 " by owner: " + user.getEmail());
                
                return ResponseEntity.ok(response);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Payment verification not found or access denied");
                return ResponseEntity.badRequest().body(error);
            }
            
        } catch (Exception e) {
            System.err.println("❌ Delete payment verification error: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to delete payment verification: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Mark visit as completed
     */
    @PutMapping("/orders/{bookingId}/visit-completed")
    public ResponseEntity<?> markVisitCompleted(@PathVariable Long bookingId, Authentication authentication) {
        try {
            // Get authenticated user
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            // Get user's establishment
            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No establishment found for this owner"));
            }
            
            // Find the booking
            Booking booking = bookingService.findById(bookingId);
            if (booking == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
            }
            
            // Verify booking belongs to owner's establishment
            if (!booking.getEstablishment().getId().equals(establishments.get(0).getId())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Booking does not belong to your establishment"));
            }
            
            // Update booking status to completed
            booking.setStatus(BookingStatus.COMPLETED);
            
            Booking updatedBooking = bookingService.save(booking);
            
            System.out.println("✅ Visit marked as completed for booking ID: " + bookingId + 
                             " by owner: " + user.getEmail());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Visit marked as completed successfully");
            response.put("booking", updatedBooking);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Mark visit completed error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to mark visit as completed: " + e.getMessage()));
        }
    }

    /**
     * Owner cancel booking with notification to user
     */
    @PutMapping("/orders/{bookingId}/cancel")
    public ResponseEntity<?> ownerCancelBooking(@PathVariable Long bookingId, 
                                              @RequestBody Map<String, String> data,
                                              Authentication authentication) {
        try {
            // Get authenticated user
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            String reason = data.get("reason");
            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cancellation reason is required"));
            }
            
            // Get user's establishment
            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No establishment found for this owner"));
            }
            
            // Cancel booking using BookingService
            Booking cancelledBooking = bookingService.ownerCancelBooking(bookingId, user.getId(), reason);
            
            System.out.println("✅ Owner cancelled booking ID: " + bookingId + 
                             " by owner: " + user.getEmail() + " Reason: " + reason);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Booking cancelled successfully. Customer has been notified and will receive full refund.");
            response.put("booking", cancelledBooking);
            response.put("refundStatus", "APPROVED");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Owner cancel booking error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to cancel booking: " + e.getMessage()));
        }
    }
    
    /**
     * Test endpoint to create sample bookings for testing
     */
    @PostMapping("/test/create-sample-booking")
    public ResponseEntity<?> createSampleBooking(Authentication authentication) {
        try {
            // Get authenticated user
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            // Get user's establishment
            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No establishment found for this owner"));
            }
            
            Establishment establishment = establishments.get(0);
            
            // Create a sample booking
            Booking sampleBooking = new Booking();
            sampleBooking.setUser(user);
            sampleBooking.setEstablishment(establishment);
            sampleBooking.setUserEmail(user.getEmail());
            sampleBooking.setVisitingDate("2024-03-25");
            sampleBooking.setVisitingTime("2:00 PM");
            sampleBooking.setAmount(new BigDecimal("100.00"));
            sampleBooking.setPaymentAmount(new BigDecimal("70.00")); // 70% payment
            sampleBooking.setTransactionId("SAMPLE_" + System.currentTimeMillis());
            sampleBooking.setStatus(BookingStatus.PENDING);
            sampleBooking.setPaymentStatus(PaymentStatus.PAID);
            sampleBooking.setSelectedItems("[{\"name\":\"Sample Item\",\"price\":100,\"quantity\":1}]");
            sampleBooking.setCreatedAt(java.time.LocalDateTime.now());
            sampleBooking.setUpdatedAt(java.time.LocalDateTime.now());
            
            Booking savedBooking = bookingService.save(sampleBooking);
            
            System.out.println("✅ Created sample booking: ID " + savedBooking.getId() + 
                             " for establishment: " + establishment.getName());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Sample booking created successfully");
            response.put("booking", savedBooking);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to create sample booking: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create sample booking: " + e.getMessage()));
        }
    }
    
    /**
     * Test endpoint to create sample payment verification for testing
     */
    @PostMapping("/test/create-sample-payment-verification")
    public ResponseEntity<?> createSamplePaymentVerification(Authentication authentication) {
        try {
            // Get authenticated user
            com.opennova.security.CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (com.opennova.security.CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            // Get user's establishment
            List<Establishment> establishments = establishmentService.findByOwnerId(user.getId());
            if (establishments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No establishment found for this owner"));
            }
            
            Establishment establishment = establishments.get(0);
            
            // First create a booking with a specific transaction ID
            String transactionRef = "TEST_" + System.currentTimeMillis();
            
            Booking testBooking = new Booking();
            testBooking.setUser(user);
            testBooking.setEstablishment(establishment);
            testBooking.setUserEmail(user.getEmail());
            testBooking.setVisitingDate("2024-03-26");
            testBooking.setVisitingTime("3:00 PM");
            testBooking.setAmount(new BigDecimal("150.00"));
            testBooking.setPaymentAmount(new BigDecimal("105.00")); // 70% payment
            testBooking.setTransactionId(transactionRef); // This will match the payment verification
            testBooking.setStatus(BookingStatus.PENDING);
            testBooking.setPaymentStatus(PaymentStatus.PAID);
            testBooking.setSelectedItems("[{\"name\":\"Test Service\",\"price\":150,\"quantity\":1}]");
            testBooking.setCreatedAt(java.time.LocalDateTime.now());
            testBooking.setUpdatedAt(java.time.LocalDateTime.now());
            
            Booking savedBooking = bookingService.save(testBooking);
            
            // Now create a payment verification that matches this booking
            PaymentVerification testVerification = new PaymentVerification(
                transactionRef, // This matches the booking's transaction ID
                "UPI_" + System.currentTimeMillis(), // UPI transaction ID
                user.getEmail(),
                establishment.getId(),
                new BigDecimal("105.00")
            );
            
            PaymentVerification savedVerification = paymentScreenshotService.submitPaymentVerification(
                transactionRef,
                "UPI_" + System.currentTimeMillis(),
                user.getEmail(),
                establishment.getId(),
                new BigDecimal("105.00"),
                null // No screenshot for test
            );
            
            System.out.println("✅ Created test booking and payment verification:");
            System.out.println("   - Booking ID: " + savedBooking.getId());
            System.out.println("   - Transaction Ref: " + transactionRef);
            System.out.println("   - Payment Verification ID: " + savedVerification.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Test booking and payment verification created successfully");
            response.put("booking", savedBooking);
            response.put("verification", savedVerification);
            response.put("transactionRef", transactionRef);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to create test data: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create test data: " + e.getMessage()));
        }
    }
}