package com.opennova.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002", "http://127.0.0.1:3002", "http://localhost:3003", "http://127.0.0.1:3003"}, maxAge = 3600)
public class ImageController {

    private final String uploadDir = "uploads";

    /**
     * Serve images for all types (public access)
     */
    @GetMapping("/images/{folder}/{filename:.+}")
    public ResponseEntity<Resource> serveImage(
            @PathVariable String folder, 
            @PathVariable String filename) {
        
        try {
            System.out.println("🖼️ Serving image request:");
            System.out.println("📁 Folder: " + folder);
            System.out.println("📄 Filename: " + filename);
            
            // Construct file path - try multiple possible locations
            Path filePath = null;
            Resource resource = null;
            
            // Try different path combinations
            String[] possiblePaths = {
                uploadDir + "/" + folder + "/" + filename,
                uploadDir + "/" + filename,
                folder + "/" + filename,
                filename
            };
            
            for (String pathStr : possiblePaths) {
                filePath = Paths.get(pathStr);
                resource = new FileSystemResource(filePath);
                
                System.out.println("🔍 Trying path: " + filePath.toAbsolutePath());
                System.out.println("📂 File exists: " + Files.exists(filePath));
                System.out.println("📖 File readable: " + Files.isReadable(filePath));
                
                if (resource.exists() && resource.isReadable()) {
                    System.out.println("✅ Found image at: " + filePath.toAbsolutePath());
                    break;
                }
                resource = null;
            }
            
            if (resource == null || !resource.exists() || !resource.isReadable()) {
                System.err.println("❌ Image not found in any location for: " + folder + "/" + filename);
                
                // Return appropriate fallback image based on folder type
                Resource fallbackResource = getFallbackImage(folder);
                if (fallbackResource != null && fallbackResource.exists()) {
                    System.out.println("🔄 Serving fallback image for folder: " + folder);
                    return createImageResponse(fallbackResource, "fallback-" + folder + ".png");
                }
                
                return ResponseEntity.notFound().build();
            }
            
            System.out.println("✅ Serving image successfully:");
            System.out.println("📄 File: " + filename);
            System.out.println("📏 Size: " + resource.contentLength() + " bytes");
            
            return createImageResponse(resource, filename);
                
        } catch (Exception e) {
            System.err.println("❌ Error serving image " + folder + "/" + filename + ": " + e.getMessage());
            e.printStackTrace();
            
            // Try to serve fallback image on error
            try {
                Resource fallbackResource = getFallbackImage(folder);
                if (fallbackResource != null && fallbackResource.exists()) {
                    return createImageResponse(fallbackResource, "fallback-" + folder + ".png");
                }
            } catch (Exception fallbackError) {
                System.err.println("❌ Error serving fallback image: " + fallbackError.getMessage());
            }
            
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Serve images with direct path (backward compatibility)
     */
    @GetMapping("/uploads/{folder}/{filename:.+}")
    public ResponseEntity<Resource> serveImageDirect(
            @PathVariable String folder, 
            @PathVariable String filename) {
        return serveImage(folder, filename);
    }

    /**
     * Get fallback image based on folder type
     */
    private Resource getFallbackImage(String folder) {
        String fallbackPath;
        
        switch (folder.toLowerCase()) {
            case "menu-images":
            case "menus":
                fallbackPath = "static/images/fallback-menu.png";
                break;
            case "doctor-images":
            case "doctors":
                fallbackPath = "static/images/fallback-doctor.png";
                break;
            case "collection-images":
            case "collections":
                fallbackPath = "static/images/fallback-collection.png";
                break;
            case "upi-qr-codes":
                fallbackPath = "static/images/fallback-qr.png";
                break;
            case "payment-screenshots":
                fallbackPath = "static/images/fallback-default.png";
                break;
            case "establishments":
                fallbackPath = "static/images/fallback-establishment.png";
                break;
            default:
                fallbackPath = "static/images/fallback-default.png";
                break;
        }
        
        try {
            Resource fallbackResource = new ClassPathResource(fallbackPath);
            if (fallbackResource.exists()) {
                return fallbackResource;
            }
        } catch (Exception e) {
            System.err.println("❌ Fallback image not found: " + fallbackPath);
        }
        
        return null;
    }

    /**
     * Create proper image response with headers
     */
    private ResponseEntity<Resource> createImageResponse(Resource resource, String filename) throws IOException {
        // Determine content type
        String contentType;
        try {
            if (resource instanceof FileSystemResource) {
                Path path = ((FileSystemResource) resource).getFile().toPath();
                contentType = Files.probeContentType(path);
            } else {
                // For classpath resources, determine by extension
                String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
                switch (extension) {
                    case "png":
                        contentType = "image/png";
                        break;
                    case "jpg":
                    case "jpeg":
                        contentType = "image/jpeg";
                        break;
                    case "gif":
                        contentType = "image/gif";
                        break;
                    case "svg":
                        contentType = "image/svg+xml";
                        break;
                    default:
                        contentType = "image/png";
                        break;
                }
            }
            
            if (contentType == null) {
                contentType = "image/png";
            }
        } catch (IOException e) {
            contentType = "image/png";
        }
        
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
            .header("Access-Control-Allow-Origin", "*")
            .header("Access-Control-Allow-Methods", "GET")
            .body(resource);
    }
}