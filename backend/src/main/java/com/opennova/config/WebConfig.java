package com.opennova.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*", "https://localhost:*", "https://127.0.0.1:*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH")
                .allowedHeaders("Authorization", "Content-Type", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers", "X-Requested-With", "Cache-Control")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve uploaded files
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
        
        // Serve static resources
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/");
                
        // Serve favicon
        registry.addResourceHandler("/favicon.ico")
                .addResourceLocations("classpath:/static/favicon.ico");
    }
}