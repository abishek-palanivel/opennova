package com.opennova.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public String storeFile(MultipartFile file, String subDirectory) throws IOException {
        // Validate file
        if (file == null || file.isEmpty()) {
            throw new IOException("File is empty or null");
        }
        
        System.out.println("📁 Storing file: " + file.getOriginalFilename() + " (Size: " + file.getSize() + " bytes)");
        
        // Validate file size (max 10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IOException("File size exceeds maximum limit of 10MB");
        }
        
        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IOException("Only image files are allowed");
        }
        
        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir, subDirectory);
        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("✅ Created upload directory: " + uploadPath.toAbsolutePath());
            }
        } catch (IOException e) {
            System.err.println("❌ Failed to create upload directory: " + uploadPath.toAbsolutePath());
            throw new IOException("Failed to create upload directory: " + e.getMessage());
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

        // Store file
        Path targetLocation = uploadPath.resolve(uniqueFilename);
        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            // Verify file was actually written
            if (!Files.exists(targetLocation) || Files.size(targetLocation) == 0) {
                throw new IOException("File was not properly written to disk");
            }
            
            String relativePath = subDirectory + "/" + uniqueFilename;
            System.out.println("✅ File stored successfully: " + relativePath + " (Size: " + Files.size(targetLocation) + " bytes)");
            System.out.println("📍 Full path: " + targetLocation.toAbsolutePath());
            
            return relativePath;
            
        } catch (IOException e) {
            System.err.println("❌ Failed to store file: " + e.getMessage());
            // Clean up partial file if it exists
            try {
                Files.deleteIfExists(targetLocation);
            } catch (IOException cleanupError) {
                System.err.println("❌ Failed to cleanup partial file: " + cleanupError.getMessage());
            }
            throw new IOException("Failed to store file: " + e.getMessage());
        }
    }

    public void deleteFile(String filePath) throws IOException {
        Path path = Paths.get(uploadDir, filePath);
        Files.deleteIfExists(path);
    }

    public Path getFilePath(String filePath) {
        return Paths.get(uploadDir, filePath);
    }
}