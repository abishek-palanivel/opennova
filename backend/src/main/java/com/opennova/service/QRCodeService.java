package com.opennova.service;

import com.opennova.model.Booking;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class QRCodeService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String generateBookingQRCode(Booking booking) {
        try {
            // Create CLEAN, READABLE QR code content that shows meaningful information when scanned
            // Instead of a URL, create a structured text that any QR reader can display nicely
            String establishmentName = booking.getEstablishment().getName();
            String customerName = booking.getUser() != null ? booking.getUser().getName() : "Guest";
            String visitDate = booking.getVisitingDate();
            String visitTime = booking.getVisitingTime();
            String amount = String.format("₹%.2f", booking.getPaymentAmount() != null ? booking.getPaymentAmount().doubleValue() : 0.0);
            String bookingRef = booking.getTransactionId();
            
            // Create clean, readable QR content
            String qrContent = String.format(
                "🎫 OPENNOVA BOOKING CONFIRMATION\n\n" +
                "🏢 %s\n" +
                "👤 %s\n" +
                "📅 %s at %s\n" +
                "💰 Amount: %s\n" +
                "🔖 Booking ID: %d\n" +
                "📋 Reference: %s\n" +
                "✅ Status: %s\n\n" +
                "Show this QR code at the establishment",
                establishmentName,
                customerName,
                visitDate,
                visitTime,
                amount,
                booking.getId(),
                bookingRef,
                booking.getStatus().toString()
            );
            
            System.out.println("🔄 Generating CLEAN QR code for booking: " + booking.getId());
            System.out.println("📱 QR Content Preview:");
            System.out.println(qrContent);
            System.out.println("📱 QR data length: " + qrContent.length() + " characters (CLEAN TEXT FORMAT)");
            
            // Generate QR code image with the clean content
            return generateQRCodeImage(qrContent);
        } catch (Exception e) {
            System.err.println("❌ Failed to generate QR code: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to generate QR code: " + e.getMessage());
        }
    }

    private String generateQRCodeImage(String text) throws WriterException, IOException {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        
        // Optimized settings for faster scanning and smaller size
        Map<com.google.zxing.EncodeHintType, Object> hints = new HashMap<>();
        hints.put(com.google.zxing.EncodeHintType.ERROR_CORRECTION, com.google.zxing.qrcode.decoder.ErrorCorrectionLevel.M); // Medium error correction for balance
        hints.put(com.google.zxing.EncodeHintType.MARGIN, 1); // Smaller margin for compact size
        hints.put(com.google.zxing.EncodeHintType.CHARACTER_SET, "UTF-8");
        
        // Optimized size - smaller for faster generation and scanning
        BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, 300, 300, hints);
        
        BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
        
        // Convert to Base64 with optimized compression
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(qrImage, "PNG", baos);
        byte[] imageBytes = baos.toByteArray();
        
        String base64QR = Base64.getEncoder().encodeToString(imageBytes);
        System.out.println("✅ Optimized QR code generated (size: " + imageBytes.length + " bytes, " + 
                          (imageBytes.length < 10000 ? "FAST" : "LARGE") + " scan speed)");
        
        return base64QR;
    }

    public Map<String, Object> parseQRCode(String qrData) {
        try {
            // Handle both URL format and JSON format for backward compatibility
            if (qrData.startsWith("https://") || qrData.startsWith("http://")) {
                // Parse URL format QR code
                return parseQRCodeURL(qrData);
            } else {
                // Parse JSON format QR code (legacy)
                return objectMapper.readValue(qrData, Map.class);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse QR code data: " + e.getMessage());
        }
    }
    
    private Map<String, Object> parseQRCodeURL(String qrUrl) {
        try {
            Map<String, Object> data = new HashMap<>();
            
            // Extract query parameters from URL
            String[] parts = qrUrl.split("\\?");
            if (parts.length < 2) {
                throw new RuntimeException("Invalid QR URL format");
            }
            
            String queryString = parts[1];
            String[] params = queryString.split("&");
            
            for (String param : params) {
                String[] keyValue = param.split("=");
                if (keyValue.length == 2) {
                    String key = keyValue[0];
                    String value = keyValue[1].replace("+", " ");
                    
                    // Convert specific fields to appropriate types
                    switch (key) {
                        case "booking":
                            data.put("bookingId", Long.valueOf(value));
                            break;
                        case "establishment":
                            data.put("establishmentId", Long.valueOf(value));
                            break;
                        case "customer":
                            data.put("customerName", value);
                            break;
                        case "date":
                            data.put("visitingDate", value);
                            break;
                        case "time":
                            data.put("visitingTime", value);
                            break;
                        case "amount":
                            data.put("amount", Double.valueOf(value));
                            break;
                        case "status":
                            data.put("status", value);
                            break;
                        case "ref":
                            data.put("transactionId", value);
                            break;
                    }
                }
            }
            
            // Add type for validation
            data.put("type", "OPENNOVA_BOOKING");
            
            return data;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse QR URL: " + e.getMessage());
        }
    }

    public boolean validateQRCode(String qrData, Long bookingId) {
        try {
            Map<String, Object> data = parseQRCode(qrData);
            
            // Check if it's a valid OpenNova booking QR code
            String type = (String) data.get("type");
            if (!"OPENNOVA_BOOKING".equals(type)) {
                return false;
            }
            
            Long qrBookingId = Long.valueOf(data.get("bookingId").toString());
            return qrBookingId.equals(bookingId);
        } catch (Exception e) {
            System.err.println("QR validation error: " + e.getMessage());
            return false;
        }
    }

    public String generatePaymentQRCode(String upiUrl, Double amount, String establishmentName) {
        try {
            System.out.println("💳 Generating payment QR code for UPI URL: " + upiUrl);
            
            // Generate QR code image with optimized settings for payment
            return generateQRCodeImage(upiUrl);
        } catch (Exception e) {
            System.err.println("❌ Failed to generate payment QR code: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to generate payment QR code: " + e.getMessage());
        }
    }
}