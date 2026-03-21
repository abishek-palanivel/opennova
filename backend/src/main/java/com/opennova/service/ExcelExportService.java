package com.opennova.service;

import com.opennova.model.Booking;
import com.opennova.model.User;
import com.opennova.repository.BookingRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExcelExportService {

    @Autowired
    private BookingRepository bookingRepository;

    public byte[] exportBookingsToExcel(Long ownerId, String reportType) throws IOException {
        List<Booking> bookings;
        
        System.out.println("📊 Starting Excel export for owner ID: " + ownerId + ", Report Type: " + reportType);
        
        switch (reportType.toUpperCase()) {
            case "OWNER":
                bookings = bookingRepository.findByEstablishmentOwnerIdOrderByCreatedAtDesc(ownerId);
                System.out.println("📊 Found " + bookings.size() + " bookings for owner ID: " + ownerId);
                break;
            case "ALL":
                bookings = bookingRepository.findAllByOrderByCreatedAtDesc();
                System.out.println("📊 Found " + bookings.size() + " total bookings in system");
                break;
            default:
                bookings = bookingRepository.findByEstablishmentOwnerIdOrderByCreatedAtDesc(ownerId);
                System.out.println("📊 Found " + bookings.size() + " bookings for owner ID (default): " + ownerId);
        }

        // Debug: Print first few bookings with safe access
        if (!bookings.isEmpty()) {
            System.out.println("📊 Sample booking data:");
            for (int i = 0; i < Math.min(3, bookings.size()); i++) {
                Booking b = bookings.get(i);
                String userName = "Unknown";
                String establishmentName = "Unknown";
                
                try {
                    userName = b.getUser() != null ? b.getUser().getName() : b.getUserEmail();
                } catch (Exception e) {
                    userName = b.getUserEmail() != null ? b.getUserEmail() : "Unknown User";
                }
                
                try {
                    establishmentName = b.getEstablishment() != null ? b.getEstablishment().getName() : "Unknown Establishment";
                } catch (Exception e) {
                    establishmentName = "Unknown Establishment";
                }
                
                System.out.println("  - Booking " + b.getId() + ": " + userName + " at " + establishmentName);
            }
        } else {
            System.out.println("⚠️ No bookings found for export!");
        }

        return generateExcelFile(bookings, reportType);
    }

    public byte[] exportAllBookingsToExcel() throws IOException {
        List<Booking> bookings = bookingRepository.findAllByOrderByCreatedAtDesc();
        System.out.println("📊 Admin Export: Found " + bookings.size() + " total bookings in system");
        
        if (!bookings.isEmpty()) {
            System.out.println("📊 Sample booking data for admin export:");
            for (int i = 0; i < Math.min(3, bookings.size()); i++) {
                Booking b = bookings.get(i);
                String userName = "Unknown";
                String establishmentName = "Unknown";
                
                try {
                    userName = b.getUser() != null ? b.getUser().getName() : b.getUserEmail();
                } catch (Exception e) {
                    userName = b.getUserEmail() != null ? b.getUserEmail() : "Unknown User";
                }
                
                try {
                    establishmentName = b.getEstablishment() != null ? b.getEstablishment().getName() : "Unknown Establishment";
                } catch (Exception e) {
                    establishmentName = "Unknown Establishment";
                }
                
                System.out.println("  - Booking " + b.getId() + ": " + userName + " at " + establishmentName +
                    " Status: " + (b.getStatus() != null ? b.getStatus() : "No Status"));
            }
        }
        
        return generateExcelFile(bookings, "ALL");
    }

    private byte[] generateExcelFile(List<Booking> bookings, String reportType) throws IOException {
        System.out.println("📊 Generating Excel file with " + bookings.size() + " bookings for report type: " + reportType);
        
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Booking Report");

        // Create header style
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setFontHeightInPoints((short) 12);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        // Create data style
        CellStyle dataStyle = workbook.createCellStyle();
        dataStyle.setWrapText(true);

        // Create date style
        CellStyle dateStyle = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        dateStyle.setDataFormat(createHelper.createDataFormat().getFormat("dd/mm/yyyy hh:mm"));

        // Create header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {
            "Booking ID", "Customer Name", "Customer Email", "Establishment", "Establishment Type",
            "Visiting Date", "Visiting Time", "Selected Items", "Total Amount", 
            "Payment Amount", "Status", "Payment Status", "Refund Status",
            "Transaction ID", "Created At", "Confirmed At", "Cancelled At"
        };

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Fill data rows
        int rowNum = 1;
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        if (bookings.isEmpty()) {
            // Add a row indicating no data
            Row noDataRow = sheet.createRow(rowNum);
            Cell noDataCell = noDataRow.createCell(0);
            noDataCell.setCellValue("No booking data available");
            noDataCell.setCellStyle(dataStyle);
            
            // Merge cells for the message
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum, rowNum, 0, headers.length - 1));
            rowNum++;
        } else {
            for (Booking booking : bookings) {
                Row row = sheet.createRow(rowNum++);

                // Safe access to booking data with fallbacks
                row.createCell(0).setCellValue(booking.getId() != null ? booking.getId() : 0);
                
                // Customer name - try multiple sources
                String customerName = "Unknown Customer";
                try {
                    if (booking.getUser() != null && booking.getUser().getName() != null) {
                        customerName = booking.getUser().getName();
                    } else if (booking.getUserEmail() != null) {
                        customerName = booking.getUserEmail().split("@")[0]; // Use email prefix as fallback
                    }
                } catch (Exception e) {
                    if (booking.getUserEmail() != null) {
                        customerName = booking.getUserEmail().split("@")[0];
                    }
                }
                row.createCell(1).setCellValue(customerName);
                
                row.createCell(2).setCellValue(booking.getUserEmail() != null ? booking.getUserEmail() : "No Email");
                
                // Establishment name - safe access
                String establishmentName = "Unknown Establishment";
                String establishmentType = "Unknown Type";
                try {
                    if (booking.getEstablishment() != null) {
                        establishmentName = booking.getEstablishment().getName() != null ? 
                            booking.getEstablishment().getName() : "Unknown Establishment";
                        establishmentType = booking.getEstablishment().getType() != null ? 
                            booking.getEstablishment().getType().toString() : "Unknown Type";
                    }
                } catch (Exception e) {
                    // Keep default values
                }
                row.createCell(3).setCellValue(establishmentName);
                row.createCell(4).setCellValue(establishmentType);
                
                row.createCell(5).setCellValue(booking.getVisitingDate() != null ? booking.getVisitingDate() : "No Date");
                row.createCell(6).setCellValue(booking.getVisitingTime() != null ? booking.getVisitingTime() : "No Time");
                
                // Format selected items better
                String selectedItems = booking.getSelectedItems();
                if (selectedItems != null && selectedItems.length() > 100) {
                    selectedItems = selectedItems.substring(0, 97) + "...";
                }
                row.createCell(7).setCellValue(selectedItems != null ? selectedItems : "No Items");
                
                row.createCell(8).setCellValue(booking.getAmount() != null ? booking.getAmount().doubleValue() : 0.0);
                row.createCell(9).setCellValue(booking.getPaymentAmount() != null ? booking.getPaymentAmount().doubleValue() : 0.0);
                row.createCell(10).setCellValue(booking.getStatus() != null ? booking.getStatus().toString() : "Unknown");
                row.createCell(11).setCellValue(booking.getPaymentStatus() != null ? booking.getPaymentStatus().toString() : "Unknown");
                row.createCell(12).setCellValue(booking.getRefundStatus() != null ? booking.getRefundStatus().toString() : "N/A");
                row.createCell(13).setCellValue(booking.getTransactionId() != null ? booking.getTransactionId() : "No Transaction ID");
                row.createCell(14).setCellValue(booking.getCreatedAt() != null ? booking.getCreatedAt().format(formatter) : "Unknown");
                row.createCell(15).setCellValue(booking.getConfirmedAt() != null ? booking.getConfirmedAt().format(formatter) : "Not Confirmed");
                row.createCell(16).setCellValue(booking.getCancelledAt() != null ? booking.getCancelledAt().format(formatter) : "Not Cancelled");
            }
        }

        // Auto-size columns
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
            // Set minimum width
            if (sheet.getColumnWidth(i) < 3000) {
                sheet.setColumnWidth(i, 3000);
            }
        }

        // Add summary section
        rowNum += 2;
        Row summaryHeaderRow = sheet.createRow(rowNum++);
        Cell summaryHeaderCell = summaryHeaderRow.createCell(0);
        summaryHeaderCell.setCellValue("SUMMARY");
        summaryHeaderCell.setCellStyle(headerStyle);

        Row totalBookingsRow = sheet.createRow(rowNum++);
        Cell totalBookingsCell = totalBookingsRow.createCell(0);
        totalBookingsCell.setCellValue("Total Bookings:");
        totalBookingsCell.setCellStyle(headerStyle);
        totalBookingsRow.createCell(1).setCellValue(bookings.size());

        if (!bookings.isEmpty()) {
            // Calculate statistics
            long confirmedBookings = bookings.stream().filter(b -> 
                b.getStatus() != null && b.getStatus().toString().equals("CONFIRMED")).count();
            long pendingBookings = bookings.stream().filter(b -> 
                b.getStatus() != null && b.getStatus().toString().equals("PENDING")).count();
            long cancelledBookings = bookings.stream().filter(b -> 
                b.getStatus() != null && b.getStatus().toString().equals("CANCELLED")).count();

            Row confirmedRow = sheet.createRow(rowNum++);
            confirmedRow.createCell(0).setCellValue("Confirmed Bookings:");
            confirmedRow.createCell(1).setCellValue(confirmedBookings);

            Row pendingRow = sheet.createRow(rowNum++);
            pendingRow.createCell(0).setCellValue("Pending Bookings:");
            pendingRow.createCell(1).setCellValue(pendingBookings);

            Row cancelledRow = sheet.createRow(rowNum++);
            cancelledRow.createCell(0).setCellValue("Cancelled Bookings:");
            cancelledRow.createCell(1).setCellValue(cancelledBookings);

            // Calculate total revenue
            double totalRevenue = bookings.stream()
                .filter(b -> b.getPaymentAmount() != null)
                .mapToDouble(b -> b.getPaymentAmount().doubleValue())
                .sum();

            Row revenueRow = sheet.createRow(rowNum++);
            Cell revenueCell = revenueRow.createCell(0);
            revenueCell.setCellValue("Total Revenue:");
            revenueCell.setCellStyle(headerStyle);
            revenueRow.createCell(1).setCellValue("₹" + String.format("%.2f", totalRevenue));
        }

        // Add generation info
        rowNum += 2;
        Row timestampRow = sheet.createRow(rowNum++);
        Cell timestampCell = timestampRow.createCell(0);
        timestampCell.setCellValue("Generated on:");
        timestampCell.setCellStyle(headerStyle);
        timestampRow.createCell(1).setCellValue(LocalDateTime.now().format(formatter));

        Row reportTypeRow = sheet.createRow(rowNum++);
        reportTypeRow.createCell(0).setCellValue("Report Type:");
        reportTypeRow.createCell(1).setCellValue(reportType);

        // Convert to byte array
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();

        byte[] result = outputStream.toByteArray();
        System.out.println("📊 Excel file generated successfully. Size: " + result.length + " bytes");
        return result;
    }

    public byte[] exportEstablishmentReport(Long establishmentId) throws IOException {
        List<Booking> bookings = bookingRepository.findByEstablishmentIdOrderByCreatedAtDesc(establishmentId);
        System.out.println("📊 Exporting " + bookings.size() + " bookings for establishment ID: " + establishmentId);
        return generateExcelFile(bookings, "ESTABLISHMENT");
    }

    public byte[] exportUserBookings(Long userId) throws IOException {
        List<Booking> bookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return generateExcelFile(bookings, "USER");
    }
}