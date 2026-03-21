package com.opennova.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendEmail(String to, String subject, String body) {
        sendEmailSync(to, subject, body);
    }
    
    public void sendEmailSync(String to, String subject, String body) {
        try {
            System.out.println("📧 Attempting to send email to: " + to);
            System.out.println("📧 Subject: " + subject);
            System.out.println("📧 From: " + fromEmail);
            
            if (to == null || to.trim().isEmpty()) {
                throw new RuntimeException("Recipient email address is required");
            }
            
            if (fromEmail == null || fromEmail.trim().isEmpty()) {
                throw new RuntimeException("Sender email address is not configured");
            }
            
            // Check if body contains HTML
            boolean isHtml = body.contains("<html>") || body.contains("<div>") || body.contains("<p>");
            
            if (isHtml) {
                // Send HTML email
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                
                helper.setFrom(fromEmail);
                helper.setTo(to.trim());
                helper.setSubject(subject);
                helper.setText(body, true); // true indicates HTML content
                
                System.out.println("📤 Sending HTML email via JavaMailSender...");
                mailSender.send(message);
            } else {
                // Send plain text email
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(to.trim());
                message.setSubject(subject);
                message.setText(body);
                
                System.out.println("📤 Sending plain text email via JavaMailSender...");
                mailSender.send(message);
            }
            
            System.out.println("✅ Email sent successfully to: " + to);
        } catch (Exception e) {
            System.err.println("❌ Failed to send email to " + to + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    public void sendBookingConfirmation(com.opennova.model.Booking booking) {
        try {
            // Use userEmail field first, then fallback to user relationship
            String to = booking.getUserEmail();
            if (to == null || to.trim().isEmpty()) {
                if (booking.getUser() != null) {
                    to = booking.getUser().getEmail();
                }
            }
            
            if (to == null || to.trim().isEmpty()) {
                System.err.println("❌ Cannot send booking confirmation: No email address found for booking " + booking.getId());
                return;
            }
            
            String customerName = "Customer";
            try {
                if (booking.getUser() != null && booking.getUser().getName() != null) {
                    customerName = booking.getUser().getName();
                } else if (to.contains("@")) {
                    customerName = to.split("@")[0]; // Use email prefix as fallback
                }
            } catch (Exception e) {
                // Keep default name
            }
            
            String establishmentName = "Unknown Establishment";
            try {
                if (booking.getEstablishment() != null && booking.getEstablishment().getName() != null) {
                    establishmentName = booking.getEstablishment().getName();
                }
            } catch (Exception e) {
                // Keep default name
            }
            
            String subject = "🎉 Booking Confirmed - " + establishmentName;
            
            String body = String.format(
                "Dear %s,\n\n" +
                "Your booking has been confirmed! Here are the details:\n\n" +
                "🏢 Establishment: %s\n" +
                "📅 Date: %s\n" +
                "⏰ Time: %s\n" +
                "💰 Amount Paid: ₹%.2f\n" +
                "🆔 Booking ID: %s\n" +
                "📱 Transaction ID: %s\n\n" +
                "Please save this email for your records.\n\n" +
                "Thank you for choosing OpenNova!\n\n" +
                "Best regards,\n" +
                "OpenNova Team",
                customerName,
                establishmentName,
                booking.getVisitingDate() != null ? booking.getVisitingDate() : "Not specified",
                booking.getVisitingTime() != null ? booking.getVisitingTime() : "Not specified",
                booking.getPaymentAmount() != null ? booking.getPaymentAmount() : BigDecimal.ZERO,
                booking.getId() != null ? booking.getId() : "Unknown",
                booking.getTransactionId() != null ? booking.getTransactionId() : "Not available"
            );
            
            sendEmailSync(to, subject, body);
            System.out.println("✅ Booking confirmation email sent to: " + to + " for booking ID: " + booking.getId());
        } catch (Exception e) {
            System.err.println("❌ Failed to send booking confirmation email for booking " + booking.getId() + ": " + e.getMessage());
            e.printStackTrace();
            // Don't throw exception - booking should still succeed even if email fails
        }
    }

    public void sendEstablishmentApprovalWithCredentials(String toEmail, String establishmentName, String loginEmail, String password) {
        try {
            System.out.println("📧 Sending approval email to: " + toEmail + " for establishment: " + establishmentName);
            System.out.println("📧 Login credentials - Email: " + loginEmail + ", Password length: " + (password != null ? password.length() : "null"));
            
            String subject = "🎉 Establishment Approved - Welcome to OpenNova!";
            String body = String.format(
                "Dear %s Owner,\n\n" +
                "🎉 Congratulations! Your establishment request has been APPROVED and your account is now active.\n\n" +
                "📋 Establishment Details:\n" +
                "• Name: %s\n" +
                "• Login Email: %s\n\n" +
                "🔐 Your Login Credentials:\n" +
                "• Email: %s\n" +
                "• Password: %s\n\n" +
                "🌐 Access Your Owner Portal:\n" +
                "http://localhost:3000/login\n\n" +
                "📝 Next Steps:\n" +
                "1. Log in to your owner portal using the credentials above\n" +
                "2. Change your password for security (recommended)\n" +
                "3. Complete your establishment profile\n" +
                "4. Set up your menu/services\n" +
                "5. Start accepting bookings from customers!\n\n" +
                "💡 Important: Please save this email with your login credentials.\n\n" +
                "Welcome to the OpenNova family! We're excited to have you on board.\n\n" +
                "Best regards,\n" +
                "OpenNova Admin Team\n" +
                "📧 support@opennova.com",
                establishmentName,
                establishmentName,
                loginEmail,
                loginEmail,
                password
            );
            
            sendEmailSync(toEmail, subject, body);
            System.out.println("✅ Establishment approval email sent successfully to: " + toEmail);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to send establishment approval email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Additional methods required by other services
    public void sendNewBookingNotificationToOwner(com.opennova.model.Booking booking) {
        try {
            String to = booking.getEstablishment().getEmail();
            String subject = "New Booking Received - " + booking.getEstablishment().getName();
            String body = String.format(
                "Dear Owner,\n\n" +
                "You have received a new booking!\n\n" +
                "Customer: %s\n" +
                "Date: %s\n" +
                "Time: %s\n" +
                "Amount: ₹%.2f\n" +
                "Booking ID: %s\n\n" +
                "Please log in to your portal to manage this booking.\n\n" +
                "Best regards,\n" +
                "OpenNova Team",
                booking.getUser().getName(),
                booking.getVisitingDate(),
                booking.getVisitingTime(),
                booking.getPaymentAmount(),
                booking.getId()
            );
            sendEmailSync(to, subject, body);
        } catch (Exception e) {
            System.err.println("❌ Failed to send owner notification: " + e.getMessage());
        }
    }

    public void sendBookingCancellation(com.opennova.model.Booking booking) {
        try {
            String to = booking.getUser().getEmail();
            String subject = "Booking Cancelled - " + booking.getEstablishment().getName();
            String body = String.format(
                "Dear %s,\n\n" +
                "Your booking has been cancelled.\n\n" +
                "Booking ID: %s\n" +
                "Establishment: %s\n" +
                "Date: %s\n" +
                "Time: %s\n\n" +
                "Refund will be processed within 24 hours.\n\n" +
                "Best regards,\n" +
                "OpenNova Team",
                booking.getUser().getName(),
                booking.getId(),
                booking.getEstablishment().getName(),
                booking.getVisitingDate(),
                booking.getVisitingTime()
            );
            sendEmailSync(to, subject, body);
        } catch (Exception e) {
            System.err.println("❌ Failed to send cancellation email: " + e.getMessage());
        }
    }

    public void sendOwnerNotificationForCustomerCancellation(String ownerEmail, com.opennova.model.Booking booking, long refundAmount) {
        try {
            String subject = "Customer Cancelled Booking - " + booking.getEstablishment().getName();
            String body = String.format(
                "Dear Owner,\n\n" +
                "A customer has cancelled their booking.\n\n" +
                "Customer: %s\n" +
                "Booking ID: %s\n" +
                "Date: %s\n" +
                "Time: %s\n" +
                "Refund Amount: ₹%d\n\n" +
                "Best regards,\n" +
                "OpenNova Team",
                booking.getUser().getName(),
                booking.getId(),
                booking.getVisitingDate(),
                booking.getVisitingTime(),
                refundAmount
            );
            sendEmailSync(ownerEmail, subject, body);
        } catch (Exception e) {
            System.err.println("❌ Failed to send owner cancellation notification: " + e.getMessage());
        }
    }

    public void sendBookingCancellationToAdmin(com.opennova.model.Booking booking) {
        try {
            // Send to admin email (you can configure this in application.properties)
            String adminEmail = "admin@opennova.com"; // Or get from configuration
            String subject = "🚫 Booking Cancellation Alert - " + booking.getEstablishment().getName();
            
            String customerName = "Unknown";
            String establishmentName = "Unknown";
            
            try {
                customerName = booking.getUser() != null ? booking.getUser().getName() : booking.getUserEmail();
                establishmentName = booking.getEstablishment() != null ? booking.getEstablishment().getName() : "Unknown";
            } catch (Exception e) {
                // Use defaults
            }
            
            String body = String.format(
                "Dear Admin,\n\n" +
                "A booking has been cancelled by a customer:\n\n" +
                "👤 Customer: %s\n" +
                "📧 Email: %s\n" +
                "🏢 Establishment: %s\n" +
                "📅 Date: %s\n" +
                "⏰ Time: %s\n" +
                "💰 Amount: ₹%.2f\n" +
                "🆔 Booking ID: %s\n" +
                "📱 Transaction ID: %s\n" +
                "💸 Refund Status: %s\n" +
                "🕒 Cancelled At: %s\n\n" +
                "Please review and take necessary action if required.\n\n" +
                "Best regards,\n" +
                "OpenNova System",
                customerName,
                booking.getUserEmail() != null ? booking.getUserEmail() : "Not available",
                establishmentName,
                booking.getVisitingDate() != null ? booking.getVisitingDate() : "Not specified",
                booking.getVisitingTime() != null ? booking.getVisitingTime() : "Not specified",
                booking.getPaymentAmount() != null ? booking.getPaymentAmount() : BigDecimal.ZERO,
                booking.getId() != null ? booking.getId() : "Unknown",
                booking.getTransactionId() != null ? booking.getTransactionId() : "Not available",
                booking.getRefundStatus() != null ? booking.getRefundStatus().toString() : "Unknown",
                booking.getCancelledAt() != null ? booking.getCancelledAt().toString() : "Unknown"
            );
            
            sendEmailSync(adminEmail, subject, body);
            System.out.println("✅ Admin notification email sent for booking cancellation: " + booking.getId());
        } catch (Exception e) {
            System.err.println("❌ Failed to send admin notification email: " + e.getMessage());
            e.printStackTrace();
            // Don't throw exception - cancellation should still succeed
        }
    }

    public void sendBookingConfirmationWithQR(com.opennova.model.Booking booking) {
        try {
            // Use userEmail field instead of user relationship to avoid lazy loading issues
            String to = booking.getUserEmail() != null ? booking.getUserEmail() : 
                       (booking.getUser() != null ? booking.getUser().getEmail() : null);
            
            if (to == null || to.trim().isEmpty()) {
                System.err.println("❌ Cannot send email: No email address found for booking " + booking.getId());
                return;
            }
            
            String customerName = booking.getUser() != null ? booking.getUser().getName() : "Customer";
            String subject = "🎉 Booking Confirmed with QR Code - " + booking.getEstablishment().getName();
            
            // Create HTML email with embedded QR code image
            String body = String.format("""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 28px;">🎉 Booking Confirmed!</h1>
                        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your reservation is ready</p>
                    </div>
                    
                    <div style="padding: 30px; background: #f8f9fa;">
                        <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #2c3e50; margin-top: 0;">Booking Details</h2>
                            
                            <table style="width: 100%%; border-collapse: collapse; margin: 20px 0;">
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px 0; font-weight: bold; color: #555;">Customer:</td>
                                    <td style="padding: 12px 0; color: #333;">%s</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px 0; font-weight: bold; color: #555;">Establishment:</td>
                                    <td style="padding: 12px 0; color: #333;">%s</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px 0; font-weight: bold; color: #555;">Date:</td>
                                    <td style="padding: 12px 0; color: #333;">%s</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px 0; font-weight: bold; color: #555;">Time:</td>
                                    <td style="padding: 12px 0; color: #333;">%s</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px 0; font-weight: bold; color: #555;">Amount Paid:</td>
                                    <td style="padding: 12px 0; color: #27ae60; font-weight: bold;">₹%.2f</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; font-weight: bold; color: #555;">Booking ID:</td>
                                    <td style="padding: 12px 0; color: #333; font-family: monospace;">%s</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-top: 20px; text-align: center;">
                            <h3 style="color: #2c3e50; margin-top: 0;">Your QR Code</h3>
                            <p style="color: #666; margin-bottom: 20px;">Show this QR code at the establishment</p>
                            
                            <div style="display: inline-block; padding: 20px; background: #f8f9fa; border-radius: 10px; border: 2px dashed #ddd;">
                                <img src="data:image/png;base64,%s" alt="Booking QR Code" style="max-width: 200px; height: auto; display: block;" />
                            </div>
                            
                            <p style="color: #888; font-size: 12px; margin-top: 15px;">
                                📱 Scan this QR code at the establishment to verify your booking
                            </p>
                        </div>
                        
                        <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin-top: 20px; border-left: 4px solid #27ae60;">
                            <h4 style="color: #27ae60; margin-top: 0;">Important Instructions</h4>
                            <ul style="color: #555; margin: 0; padding-left: 20px;">
                                <li>Arrive on time for your booking</li>
                                <li>Show this QR code to the staff</li>
                                <li>Keep this email for your records</li>
                                <li>Contact us if you need to make changes</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div style="background: #2c3e50; padding: 20px; text-align: center; color: white;">
                        <p style="margin: 0; font-size: 14px;">Thank you for choosing OpenNova!</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">
                            Need help? Contact our support team
                        </p>
                    </div>
                </body>
                </html>
                """, 
                customerName,
                booking.getEstablishment().getName(),
                booking.getVisitingDate(),
                booking.getVisitingTime(),
                booking.getPaymentAmount(),
                booking.getId(),
                booking.getQrCode()
            );
            
            sendEmailSync(to, subject, body);
            System.out.println("✅ Booking confirmation with embedded QR code sent to: " + to);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to send QR confirmation email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendBookingRejectionWithDetails(com.opennova.model.Booking booking, String reason) {
        try {
            String to = booking.getUser().getEmail();
            String subject = "Booking Rejected - " + booking.getEstablishment().getName();
            String body = String.format(
                "Dear %s,\n\n" +
                "Unfortunately, your booking has been rejected.\n\n" +
                "Establishment: %s\n" +
                "Booking ID: %s\n" +
                "Reason: %s\n\n" +
                "Full refund will be processed within 24 hours.\n\n" +
                "Best regards,\n" +
                "OpenNova Team",
                booking.getUser().getName(),
                booking.getEstablishment().getName(),
                booking.getId(),
                reason
            );
            sendEmailSync(to, subject, body);
        } catch (Exception e) {
            System.err.println("❌ Failed to send rejection email: " + e.getMessage());
        }
    }

    public void sendBookingQRCode(String to, com.opennova.model.Booking booking, String qrCode) {
        try {
            String subject = "Your QR Code - " + booking.getEstablishment().getName();
            String body = String.format(
                "Dear Customer,\n\n" +
                "Here is your QR code for the booking:\n\n" +
                "Establishment: %s\n" +
                "Date: %s\n" +
                "Time: %s\n" +
                "QR Code: %s\n\n" +
                "Please show this at the establishment.\n\n" +
                "Best regards,\n" +
                "OpenNova Team",
                booking.getEstablishment().getName(),
                booking.getVisitingDate(),
                booking.getVisitingTime(),
                qrCode
            );
            sendEmailSync(to, subject, body);
        } catch (Exception e) {
            System.err.println("❌ Failed to send QR code email: " + e.getMessage());
        }
    }

    public void sendEstablishmentRequestApproval(String to, String establishmentName, String email, String password) {
        sendEstablishmentApprovalWithCredentials(to, establishmentName, email, password);
    }

    public void sendOwnerCredentials(com.opennova.model.User user, String password) {
        try {
            System.out.println("📧 Sending owner credentials email:");
            System.out.println("   - To: " + user.getEmail());
            System.out.println("   - Password length: " + (password != null ? password.length() : "null"));
            System.out.println("   - Password type: " + (password != null && password.equals("OpenNova@123") ? "Default" : "Custom"));
            
            String subject = "🎉 Welcome to OpenNova - Your Owner Account is Ready!";
            String body = String.format(
                "Dear %s,\n\n" +
                "Congratulations! Your establishment owner account has been successfully created by our admin team.\n\n" +
                "🔐 Your Login Credentials:\n" +
                "• Email: %s\n" +
                "• Password: %s\n\n" +
                "🚀 Next Steps:\n" +
                "1. Log in to your owner portal at: http://localhost:3000/login\n" +
                "2. Change your password for security\n" +
                "3. Complete your establishment profile\n" +
                "4. Set up your menu/services\n" +
                "5. Start accepting bookings!\n\n" +
                "📞 Need Help?\n" +
                "If you have any questions or need assistance, please contact our support team.\n\n" +
                "Welcome to the OpenNova family! We're excited to have you on board.\n\n" +
                "Best regards,\n" +
                "OpenNova Admin Team\n" +
                "📧 support@opennova.com",
                user.getName(),
                user.getEmail(),
                password
            );
            
            sendEmailSync(user.getEmail(), subject, body);
            System.out.println("✅ Owner credentials email sent successfully to: " + user.getEmail());
            System.out.println("✅ Email contained password: " + (password != null && password.equals("OpenNova@123") ? "Default (OpenNova@123)" : "Custom password"));
        } catch (Exception e) {
            System.err.println("❌ Failed to send owner credentials: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendBookingRejection(com.opennova.model.Booking booking, String reason) {
        sendBookingRejectionWithDetails(booking, reason);
    }

    public void sendEstablishmentRequestApprovalEmail(String to, String establishmentName) {
        try {
            String subject = "🎉 Your Establishment Request Has Been Approved!";
            String body = String.format("""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2563eb; margin-bottom: 10px;">OpenNova</h1>
                            <h2 style="color: #16a34a; margin: 0;">Request Approved! 🎉</h2>
                        </div>
                        
                        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h3 style="color: #1e40af; margin-top: 0;">Great News!</h3>
                            <p>Your establishment request for <strong>%s</strong> has been approved by our admin team.</p>
                        </div>
                        
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="color: #374151; margin-top: 0;">What's Next?</h4>
                            <ul style="color: #6b7280;">
                                <li>Your establishment will be visible to users on our platform</li>
                                <li>You can start receiving bookings and reviews</li>
                                <li>Log in to your account to manage your establishment</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <p style="color: #6b7280; font-size: 14px;">
                                Thank you for choosing OpenNova!<br>
                                If you have any questions, please contact our support team.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                """, establishmentName);
            
            sendEmailSync(to, subject, body);
        } catch (Exception e) {
            System.err.println("Failed to send establishment approval email: " + e.getMessage());
        }
    }

    public void sendEstablishmentRequestRejectionEmail(String to, String establishmentName, String reason) {
        try {
            String subject = "Update on Your Establishment Request";
            String reasonText = (reason != null && !reason.trim().isEmpty()) 
                ? reason.trim() 
                : "Please ensure all information is accurate and meets our guidelines.";
                
            String body = String.format("""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2563eb; margin-bottom: 10px;">OpenNova</h1>
                            <h2 style="color: #dc2626; margin: 0;">Request Update</h2>
                        </div>
                        
                        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
                            <h3 style="color: #991b1b; margin-top: 0;">Request Status Update</h3>
                            <p>We regret to inform you that your establishment request for <strong>%s</strong> could not be approved at this time.</p>
                        </div>
                        
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="color: #374151; margin-top: 0;">Reason:</h4>
                            <p style="color: #6b7280; font-style: italic;">%s</p>
                        </div>
                        
                        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="color: #1e40af; margin-top: 0;">What You Can Do:</h4>
                            <ul style="color: #6b7280;">
                                <li>Review the feedback provided above</li>
                                <li>Make necessary corrections to your establishment information</li>
                                <li>Submit a new request with updated details</li>
                                <li>Contact our support team if you need assistance</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <p style="color: #6b7280; font-size: 14px;">
                                We appreciate your interest in OpenNova.<br>
                                Please don't hesitate to reach out if you have any questions.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                """, establishmentName, reasonText);
            
            sendEmailSync(to, subject, body);
        } catch (Exception e) {
            System.err.println("Failed to send establishment rejection email: " + e.getMessage());
        }
    }
    
    /**
     * Send payment rejection email to customer
     */
    public void sendPaymentRejectionEmail(String customerEmail, String establishmentName, String reason, Double refundAmount) {
        try {
            String subject = "Payment Verification Update - " + establishmentName;
            String reasonText = (reason != null && !reason.trim().isEmpty()) 
                ? reason.trim() 
                : "Payment verification could not be completed.";
                
            String body = String.format("""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2563eb; margin-bottom: 10px;">OpenNova</h1>
                            <h2 style="color: #dc2626; margin: 0;">Payment Update</h2>
                        </div>
                        
                        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
                            <h3 style="color: #991b1b; margin-top: 0;">Payment Verification Status</h3>
                            <p>We regret to inform you that your payment verification for <strong>%s</strong> could not be approved.</p>
                        </div>
                        
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="color: #374151; margin-top: 0;">Reason:</h4>
                            <p style="color: #6b7280; background-color: #fff; padding: 15px; border-radius: 4px; border: 1px solid #e5e7eb;">%s</p>
                        </div>
                        
                        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="color: #1e40af; margin-top: 0;">Refund Information</h4>
                            <p>A full refund of <strong>₹%.2f</strong> will be processed within 24-48 hours.</p>
                            <p style="color: #6b7280; font-size: 14px;">The refund will be credited to your original payment method.</p>
                        </div>
                        
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="color: #374151; margin-top: 0;">What You Can Do:</h4>
                            <ul style="color: #6b7280;">
                                <li>Make a new booking with the correct payment details</li>
                                <li>Ensure you pay the exact amount required</li>
                                <li>Upload a clear screenshot of your payment</li>
                                <li>Contact our support team if you need assistance</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <p style="color: #6b7280; font-size: 14px;">
                                We apologize for any inconvenience caused.<br>
                                Thank you for choosing OpenNova!
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                """, establishmentName, reasonText, refundAmount);
            
            sendEmailSync(customerEmail, subject, body);
            System.out.println("📧 Payment rejection email sent to: " + customerEmail);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to send payment rejection email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Send owner cancellation notification to customer
     */
    public void sendOwnerCancellationNotification(com.opennova.model.Booking booking, String reason) {
        try {
            String to = booking.getUserEmail();
            String subject = "Booking Cancelled by " + booking.getEstablishment().getName();
            String body = String.format(
                "Dear %s,\n\n" +
                "We regret to inform you that your booking has been cancelled by the establishment.\n\n" +
                "Booking Details:\n" +
                "- Establishment: %s\n" +
                "- Date: %s at %s\n" +
                "- Booking ID: %d\n" +
                "- Amount: ₹%.2f\n\n" +
                "Reason for cancellation: %s\n\n" +
                "A full refund of ₹%.2f will be processed within 24 hours.\n\n" +
                "We apologize for any inconvenience caused.\n\n" +
                "Best regards,\n" +
                "OpenNova Team",
                booking.getUser() != null ? booking.getUser().getName() : "Customer",
                booking.getEstablishment().getName(),
                booking.getVisitingDate(),
                booking.getVisitingTime(),
                booking.getId(),
                booking.getAmount() != null ? booking.getAmount().doubleValue() : 0.0,
                reason,
                booking.getPaymentAmount() != null ? booking.getPaymentAmount().doubleValue() : 0.0
            );
            
            sendEmailSync(to, subject, body);
            System.out.println("✅ Owner cancellation notification sent to customer: " + to);
        } catch (Exception e) {
            System.err.println("❌ Failed to send owner cancellation notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Send owner cancellation confirmation to establishment
     */
    public void sendOwnerCancellationConfirmation(String ownerEmail, com.opennova.model.Booking booking, String reason) {
        try {
            String subject = "Booking Cancellation Confirmed - " + booking.getEstablishment().getName();
            String body = String.format(
                "Dear Owner,\n\n" +
                "Your cancellation of the following booking has been processed:\n\n" +
                "Booking Details:\n" +
                "- Customer: %s (%s)\n" +
                "- Date: %s at %s\n" +
                "- Booking ID: %d\n" +
                "- Amount: ₹%.2f\n\n" +
                "Cancellation reason: %s\n\n" +
                "The customer has been notified and will receive a full refund of ₹%.2f within 24 hours.\n\n" +
                "Best regards,\n" +
                "OpenNova Team",
                booking.getUser() != null ? booking.getUser().getName() : "Customer",
                booking.getUserEmail(),
                booking.getVisitingDate(),
                booking.getVisitingTime(),
                booking.getId(),
                booking.getAmount() != null ? booking.getAmount().doubleValue() : 0.0,
                reason,
                booking.getPaymentAmount() != null ? booking.getPaymentAmount().doubleValue() : 0.0
            );
            
            sendEmailSync(ownerEmail, subject, body);
            System.out.println("✅ Owner cancellation confirmation sent to: " + ownerEmail);
        } catch (Exception e) {
            System.err.println("❌ Failed to send owner cancellation confirmation: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Send account suspension notification to user
     */
    public void sendAccountSuspensionEmail(com.opennova.model.User user) {
        try {
            String subject = "Account Suspended - OpenNova";
            String body = String.format("""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2563eb; margin-bottom: 10px;">OpenNova</h1>
                            <h2 style="color: #dc2626; margin: 0;">Account Suspended</h2>
                        </div>
                        
                        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
                            <h3 style="color: #991b1b; margin-top: 0;">Account Status Update</h3>
                            <p>Dear %s,</p>
                            <p>Your OpenNova account has been suspended by our administrators.</p>
                        </div>
                        
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="color: #374151; margin-top: 0;">What this means:</h4>
                            <ul style="color: #6b7280;">
                                <li>You will not be able to log in to your account</li>
                                <li>All your bookings and data remain safe</li>
                                <li>You can contact support for assistance</li>
                            </ul>
                        </div>
                        
                        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="color: #1e40af; margin-top: 0;">Need Help?</h4>
                            <p>If you believe this is a mistake or need assistance, please contact our support team:</p>
                            <p><strong>Email:</strong> <a href="mailto:support@opennova.com" style="color: #2563eb;">support@opennova.com</a></p>
                            <p><strong>Subject:</strong> Account Suspension - %s</p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <p style="color: #6b7280; font-size: 14px;">
                                Thank you for your understanding.<br>
                                OpenNova Support Team
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                """, user.getName(), user.getEmail());
            
            sendEmailSync(user.getEmail(), subject, body);
            System.out.println("📧 Account suspension email sent to: " + user.getEmail());
            
        } catch (Exception e) {
            System.err.println("❌ Failed to send account suspension email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Send account activation notification to user
     */
    public void sendAccountActivationEmail(com.opennova.model.User user) {
        try {
            String subject = "Account Activated - OpenNova";
            String body = String.format("""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2563eb; margin-bottom: 10px;">OpenNova</h1>
                            <h2 style="color: #059669; margin: 0;">Account Activated</h2>
                        </div>
                        
                        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #059669;">
                            <h3 style="color: #065f46; margin-top: 0;">Welcome Back!</h3>
                            <p>Dear %s,</p>
                            <p>Great news! Your OpenNova account has been activated and you can now access the platform.</p>
                        </div>
                        
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="color: #374151; margin-top: 0;">What you can do now:</h4>
                            <ul style="color: #6b7280;">
                                <li>Log in to your account</li>
                                <li>Browse and book establishments</li>
                                <li>Manage your bookings</li>
                                <li>Leave reviews and ratings</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin-bottom: 20px;">
                            <a href="http://localhost:3000/auth/login" 
                               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                Log In Now
                            </a>
                        </div>
                        
                        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="color: #1e40af; margin-top: 0;">Need Help?</h4>
                            <p>If you have any questions, feel free to contact our support team:</p>
                            <p><strong>Email:</strong> <a href="mailto:support@opennova.com" style="color: #2563eb;">support@opennova.com</a></p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <p style="color: #6b7280; font-size: 14px;">
                                Welcome back to OpenNova!<br>
                                OpenNova Support Team
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                """, user.getName());
            
            sendEmailSync(user.getEmail(), subject, body);
            System.out.println("📧 Account activation email sent to: " + user.getEmail());
            
        } catch (Exception e) {
            System.err.println("❌ Failed to send account activation email: " + e.getMessage());
            e.printStackTrace();
        }
    }
}