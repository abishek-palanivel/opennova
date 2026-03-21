package com.opennova.service;

import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class FallbackImageService {

    public void createFallbackImages() {
        try {
            Path staticImagesDir = Paths.get("backend/src/main/resources/static/images");
            Files.createDirectories(staticImagesDir);

            // Create different fallback images
            createFallbackImage(staticImagesDir.resolve("fallback-menu.png"), "🍽️", "Menu Item", new Color(255, 165, 0));
            createFallbackImage(staticImagesDir.resolve("fallback-doctor.png"), "👨‍⚕️", "Doctor", new Color(0, 123, 255));
            createFallbackImage(staticImagesDir.resolve("fallback-collection.png"), "🛍️", "Product", new Color(40, 167, 69));
            createFallbackImage(staticImagesDir.resolve("fallback-qr.png"), "📱", "QR Code", new Color(108, 117, 125));
            createFallbackImage(staticImagesDir.resolve("fallback-establishment.png"), "🏢", "Business", new Color(220, 53, 69));
            createFallbackImage(staticImagesDir.resolve("fallback-default.png"), "📷", "Image", new Color(108, 117, 125));

            System.out.println("✅ Fallback images created successfully");
        } catch (Exception e) {
            System.err.println("❌ Failed to create fallback images: " + e.getMessage());
        }
    }

    private void createFallbackImage(Path filePath, String emoji, String text, Color bgColor) throws IOException {
        int width = 300;
        int height = 300;

        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = image.createGraphics();

        // Enable anti-aliasing
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        // Background
        g2d.setColor(new Color(248, 249, 250));
        g2d.fillRect(0, 0, width, height);

        // Border
        g2d.setColor(new Color(233, 236, 239));
        g2d.setStroke(new BasicStroke(2));
        g2d.drawRect(1, 1, width - 2, height - 2);

        // Icon background circle
        int circleSize = 120;
        int circleX = (width - circleSize) / 2;
        int circleY = (height - circleSize) / 2 - 20;
        
        g2d.setColor(bgColor.brighter());
        g2d.fillOval(circleX, circleY, circleSize, circleSize);

        // Emoji (simplified as text)
        g2d.setColor(Color.WHITE);
        g2d.setFont(new Font("Arial", Font.BOLD, 48));
        FontMetrics fm = g2d.getFontMetrics();
        int emojiX = circleX + (circleSize - fm.stringWidth(emoji)) / 2;
        int emojiY = circleY + (circleSize + fm.getAscent()) / 2;
        g2d.drawString(emoji, emojiX, emojiY);

        // Text
        g2d.setColor(new Color(108, 117, 125));
        g2d.setFont(new Font("Arial", Font.PLAIN, 16));
        fm = g2d.getFontMetrics();
        int textX = (width - fm.stringWidth(text)) / 2;
        int textY = circleY + circleSize + 30;
        g2d.drawString(text, textX, textY);

        // "Image not available" text
        String notAvailable = "Image not available";
        g2d.setFont(new Font("Arial", Font.PLAIN, 12));
        fm = g2d.getFontMetrics();
        int notAvailableX = (width - fm.stringWidth(notAvailable)) / 2;
        int notAvailableY = textY + 25;
        g2d.drawString(notAvailable, notAvailableX, notAvailableY);

        g2d.dispose();

        // Save image
        ImageIO.write(image, "PNG", filePath.toFile());
    }
}