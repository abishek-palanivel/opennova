package com.opennova.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
public class ErrorController implements org.springframework.boot.web.servlet.error.ErrorController {

    @RequestMapping("/error")
    public ResponseEntity<?> handleError(HttpServletRequest request) {
        // Get error status
        Object status = request.getAttribute("javax.servlet.error.status_code");
        
        Map<String, Object> errorResponse = new HashMap<>();
        
        if (status != null) {
            Integer statusCode = Integer.valueOf(status.toString());
            
            switch (statusCode) {
                case 401:
                    errorResponse.put("error", "Unauthorized");
                    errorResponse.put("message", "Authentication required");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
                case 403:
                    errorResponse.put("error", "Forbidden");
                    errorResponse.put("message", "Access denied");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
                case 404:
                    errorResponse.put("error", "Not Found");
                    errorResponse.put("message", "Resource not found");
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
                default:
                    errorResponse.put("error", "Internal Server Error");
                    errorResponse.put("message", "An unexpected error occurred");
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        }
        
        errorResponse.put("error", "Unknown Error");
        errorResponse.put("message", "An unknown error occurred");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}