package com.opennova.controller;

import com.opennova.dto.AuthResponse;
import com.opennova.dto.LoginRequest;
import com.opennova.dto.RegisterRequest;
import com.opennova.model.User;
import com.opennova.security.JwtUtil;
import com.opennova.service.AuthService;
import com.opennova.service.UserService;
import com.opennova.service.GoogleOAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002", "http://127.0.0.1:3002", "http://localhost:3003", "http://127.0.0.1:3003"}, maxAge = 3600)
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private com.opennova.service.EstablishmentService establishmentService;

    @Autowired
    private com.opennova.security.CustomUserDetailsService customUserDetailsService;

    @Autowired
    private GoogleOAuthService googleOAuthService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            System.out.println("=== Login Request Received ===");
            
            // Validate input
            if (loginRequest == null) {
                System.err.println("Login request is null");
                Map<String, String> error = new HashMap<>();
                error.put("message", "Login request is required");
                return ResponseEntity.badRequest().body(error);
            }
            
            System.out.println("Login request data: email=" + loginRequest.getEmail() + ", password=" + (loginRequest.getPassword() != null ? "[PROVIDED]" : "[NULL]"));
            
            if (loginRequest.getEmail() == null || loginRequest.getEmail().trim().isEmpty()) {
                System.err.println("Email is null or empty");
                Map<String, String> error = new HashMap<>();
                error.put("message", "Email is required");
                return ResponseEntity.badRequest().body(error);
            }
            
            if (loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
                System.err.println("Password is null or empty");
                Map<String, String> error = new HashMap<>();
                error.put("message", "Password is required");
                return ResponseEntity.badRequest().body(error);
            }

            String email = loginRequest.getEmail().trim();
            System.out.println("Login attempt for email: " + email);

            // Check if user exists first
            User existingUser = userService.findByEmailSafe(email);
            if (existingUser == null) {
                System.err.println("User not found in database: " + email);
                authService.handleFailedLogin(email); // Log failed attempt (no locking)
                Map<String, String> error = new HashMap<>();
                error.put("message", "Account not found. Please sign up first or use Google Sign In.");
                error.put("needsSignup", "true");
                return ResponseEntity.badRequest().body(error);
            }
            
            System.out.println("User found: " + existingUser.getName() + " with role: " + existingUser.getRole());

            // Check if user account is active/enabled
            if (existingUser.getIsActive() == null || !existingUser.getIsActive()) {
                System.err.println("Account is deactivated/suspended for user: " + email);
                Map<String, String> error = new HashMap<>();
                error.put("message", "Your account has been suspended or deactivated. Please contact support for assistance.");
                error.put("accountStatus", "SUSPENDED");
                error.put("supportEmail", "support@opennova.com");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }

            // Ensure establishment assignment for owner roles
            if (existingUser.getRole() == com.opennova.model.UserRole.HOSPITAL_OWNER ||
                existingUser.getRole() == com.opennova.model.UserRole.SHOP_OWNER ||
                existingUser.getRole() == com.opennova.model.UserRole.HOTEL_OWNER) {
                
                try {
                    establishmentService.assignEstablishmentToUser(existingUser);
                } catch (Exception e) {
                    System.err.println("⚠️ Failed to ensure establishment assignment during login: " + e.getMessage());
                    // Don't fail login if establishment assignment fails
                }
            }

            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, loginRequest.getPassword())
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            System.out.println("Authentication successful for: " + userDetails.getUsername());
            
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", existingUser.getRole().name());
            claims.put("userId", existingUser.getId());
            
            String jwt = jwtUtil.generateToken(userDetails, claims);
            System.out.println("JWT token generated successfully");

            // Log successful login (no need to reset attempts since locking is disabled)
            authService.handleSuccessfulLogin(email);

            // Get establishment type for owner roles
            String establishmentType = null;
            if (existingUser.getRole() == com.opennova.model.UserRole.HOSPITAL_OWNER ||
                existingUser.getRole() == com.opennova.model.UserRole.SHOP_OWNER ||
                existingUser.getRole() == com.opennova.model.UserRole.HOTEL_OWNER ||
                existingUser.getRole() == com.opennova.model.UserRole.OWNER) {
                
                try {
                    com.opennova.model.Establishment establishment = establishmentService.findByOwner(existingUser);
                    if (establishment != null && establishment.getType() != null) {
                        establishmentType = establishment.getType().toString();
                    }
                } catch (Exception e) {
                    System.err.println("Failed to get establishment type: " + e.getMessage());
                }
            }

            AuthResponse.UserResponse userResponse = new AuthResponse.UserResponse(
                existingUser.getId(),
                existingUser.getName(),
                existingUser.getEmail(),
                existingUser.getRole(),
                establishmentType
            );

            System.out.println("Login successful for user: " + existingUser.getEmail() + " with role: " + existingUser.getRole());
            return ResponseEntity.ok(new AuthResponse(jwt, userResponse));
            
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            System.err.println("Bad credentials for email: " + (loginRequest != null ? loginRequest.getEmail() : "null"));
            System.err.println("BadCredentialsException details: " + e.getMessage());
            
            // Log failed login attempt (no locking)
            if (loginRequest != null && loginRequest.getEmail() != null) {
                authService.handleFailedLogin(loginRequest.getEmail().trim());
            }
            
            Map<String, String> error = new HashMap<>();
            error.put("message", "Invalid email or password");
            return ResponseEntity.badRequest().body(error);
        } catch (org.springframework.security.authentication.DisabledException e) {
            System.err.println("Account disabled: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Your account has been suspended or deactivated. Please contact support for assistance.");
            error.put("accountStatus", "SUSPENDED");
            error.put("supportEmail", "support@opennova.com");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        } catch (Exception e) {
            System.err.println("Login error: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Login failed. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            if (userService.existsByEmail(registerRequest.getEmail())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Email is already registered");
                return ResponseEntity.badRequest().body(error);
            }

            User user = authService.registerUser(registerRequest);
            
            // Auto-login the user after successful registration
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(user.getEmail());
            
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", user.getRole().name());
            claims.put("userId", user.getId());
            
            String token = jwtUtil.generateToken(userDetails, claims);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "User registered successfully");
            response.put("success", true);
            response.put("token", token);
            response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole().toString()
            ));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Registration failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            
            if (email == null || email.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Email is required");
                return ResponseEntity.badRequest().body(error);
            }
            
            authService.sendPasswordResetEmail(email.trim());
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password reset link sent to your email");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to send reset email: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String newPassword = request.get("password");
            
            authService.resetPassword(token, newPassword);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password reset successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Password reset failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/assign-establishment")
    public ResponseEntity<?> assignEstablishment() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Authentication required");
                return ResponseEntity.status(401).body(error);
            }
            
            String email = authentication.getName();
            User user = userService.findByEmailSafe(email);
            if (user == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "User not found");
                return ResponseEntity.status(404).body(error);
            }
            
            com.opennova.model.Establishment establishment = establishmentService.assignEstablishmentToUser(user);
            
            if (establishment != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Establishment assigned successfully");
                response.put("establishment", establishment.getName());
                response.put("type", establishment.getType());
                return ResponseEntity.ok(response);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("message", "No available establishment found for your role");
                return ResponseEntity.badRequest().body(error);
            }
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to assign establishment: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile() {
        try {
            System.out.println("=== Profile Endpoint Called ===");
            
            // Check authentication
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                System.err.println("No authentication found in profile endpoint");
                Map<String, String> error = new HashMap<>();
                error.put("message", "Authentication required");
                return ResponseEntity.status(401).body(error);
            }
            
            String email = authentication.getName();
            if (email == null || email.trim().isEmpty()) {
                System.err.println("No email found in authentication");
                Map<String, String> error = new HashMap<>();
                error.put("message", "Invalid authentication token");
                return ResponseEntity.status(401).body(error);
            }
            
            System.out.println("Fetching profile for user: " + email);
            
            // Get user with safe method
            User user = null;
            try {
                user = userService.findByEmailSafe(email);
            } catch (Exception e) {
                System.err.println("Error finding user by email: " + e.getMessage());
                Map<String, String> error = new HashMap<>();
                error.put("message", "Database error while fetching user profile");
                return ResponseEntity.status(500).body(error);
            }
            
            if (user == null) {
                System.err.println("User not found in database: " + email);
                Map<String, String> error = new HashMap<>();
                error.put("message", "User not found");
                return ResponseEntity.status(404).body(error);
            }
            
            System.out.println("User found: " + user.getName() + " with role: " + user.getRole().name());
            
            // Get establishment type for owner roles
            String establishmentType = null;
            if (user.getRole() == com.opennova.model.UserRole.HOSPITAL_OWNER ||
                user.getRole() == com.opennova.model.UserRole.SHOP_OWNER ||
                user.getRole() == com.opennova.model.UserRole.HOTEL_OWNER ||
                user.getRole() == com.opennova.model.UserRole.OWNER) {
                
                try {
                    com.opennova.model.Establishment establishment = establishmentService.findByOwner(user);
                    if (establishment != null && establishment.getType() != null) {
                        establishmentType = establishment.getType().toString();
                    }
                } catch (Exception e) {
                    System.err.println("Failed to get establishment type for profile: " + e.getMessage());
                }
            }
            
            AuthResponse.UserResponse userResponse = new AuthResponse.UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                establishmentType
            );
            
            return ResponseEntity.ok(userResponse);
        } catch (Exception e) {
            System.err.println("Error in getUserProfile: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get user profile: " + e.getMessage());
            error.put("error", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(error);
        }
    }
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {
        try {
            System.out.println("=== Token Refresh Endpoint Called ===");

            // Get token from Authorization header
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "No valid token provided");
                return ResponseEntity.status(401).body(error);
            }

            String token = authHeader.substring(7);

            // Validate token format (even if expired)
            try {
                String username = jwtUtil.extractUsername(token);
                if (username == null || username.trim().isEmpty()) {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "Invalid token format");
                    return ResponseEntity.status(401).body(error);
                }

                // Check if user still exists
                User user = userService.findByEmailSafe(username);
                if (user == null) {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "User not found");
                    return ResponseEntity.status(401).body(error);
                }

                // Generate new token
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);
                Map<String, Object> claims = new HashMap<>();
                claims.put("userId", user.getId());
                claims.put("role", user.getRole().name());

                String newToken = jwtUtil.generateToken(userDetails, claims);

                // Get establishment type for response
                String establishmentType = null;
                if (user.getRole() == com.opennova.model.UserRole.HOSPITAL_OWNER ||
                    user.getRole() == com.opennova.model.UserRole.SHOP_OWNER ||
                    user.getRole() == com.opennova.model.UserRole.HOTEL_OWNER ||
                    user.getRole() == com.opennova.model.UserRole.OWNER) {

                    try {
                        com.opennova.model.Establishment establishment = establishmentService.findByOwner(user);
                        if (establishment != null && establishment.getType() != null) {
                            establishmentType = establishment.getType().toString();
                        }
                    } catch (Exception e) {
                        System.err.println("Failed to get establishment type for refresh: " + e.getMessage());
                    }
                }

                AuthResponse.UserResponse userResponse = new AuthResponse.UserResponse(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole(),
                    establishmentType
                );

                AuthResponse response = new AuthResponse(newToken, userResponse);
                System.out.println("Token refreshed successfully for user: " + username);

                return ResponseEntity.ok(response);

            } catch (Exception e) {
                System.err.println("Error processing token refresh: " + e.getMessage());
                Map<String, String> error = new HashMap<>();
                error.put("message", "Invalid or expired token");
                return ResponseEntity.status(401).body(error);
            }

        } catch (Exception e) {
            System.err.println("Error in refreshToken: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("message", "Token refresh failed");
            return ResponseEntity.status(500).body(error);
        }
    }

    @PostMapping("/check-account-status")
    public ResponseEntity<?> checkAccountStatus(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            
            if (email == null || email.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Email is required");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Account locking has been disabled - all accounts are always unlocked
            Map<String, Object> response = new HashMap<>();
            response.put("isLocked", false);
            response.put("message", "Account locking has been disabled for better user experience");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to check account status: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Google OAuth Login - Get Authorization URL
     */
    @GetMapping("/google")
    public ResponseEntity<?> googleLogin() {
        try {
            String authorizationUrl = googleOAuthService.getAuthorizationUrl();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("authorizationUrl", authorizationUrl);
            response.put("message", "Redirect to Google for authentication");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Google OAuth URL generation failed: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to generate Google OAuth URL: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Google OAuth Callback - Handle Authorization Code
     */
    @GetMapping("/google/callback")
    public void googleCallback(@RequestParam("code") String authorizationCode,
                              @RequestParam(value = "state", required = false) String state,
                              HttpServletResponse response) {
        try {
            // Get user info from Google
            GoogleOAuthService.GoogleUserInfo googleUserInfo = googleOAuthService.getUserInfo(authorizationCode);
            
            // Find or create user
            User user = userService.findByEmailSafe(googleUserInfo.getEmail());
            
            if (user == null) {
                // Don't automatically create user - redirect to signup confirmation
                System.out.println("❌ Google user not found, redirecting to signup: " + googleUserInfo.getEmail());
                
                // Redirect to signup confirmation page with Google info
                String redirectUrl = String.format("http://localhost:3000/auth/google/signup?email=%s&name=%s&picture=%s&googleId=%s", 
                    java.net.URLEncoder.encode(googleUserInfo.getEmail(), "UTF-8"),
                    java.net.URLEncoder.encode(googleUserInfo.getName(), "UTF-8"),
                    java.net.URLEncoder.encode(googleUserInfo.getPicture() != null ? googleUserInfo.getPicture() : "", "UTF-8"),
                    java.net.URLEncoder.encode(googleUserInfo.getId(), "UTF-8"));
                
                response.sendRedirect(redirectUrl);
                return;
            } else {
                // Update existing user with Google info
                user.setGoogleId(googleUserInfo.getId());
                user.setProfilePictureUrl(googleUserInfo.getPicture());
                if (user.getAuthProvider() == User.AuthProvider.LOCAL) {
                    user.setAuthProvider(User.AuthProvider.GOOGLE);
                }
                user = userService.save(user);
                System.out.println("✅ Existing user updated with Google info: " + user.getEmail());
            }
            
            // Generate JWT token
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(user.getEmail());
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", user.getRole().name());
            claims.put("userId", user.getId());
            String token = jwtUtil.generateToken(userDetails, claims);
            
            // Redirect to frontend with token (URL encode the parameters)
            String redirectUrl = String.format("http://localhost:3000/auth/google/success?token=%s&user=%s&role=%s", 
                java.net.URLEncoder.encode(token, "UTF-8"), 
                java.net.URLEncoder.encode(user.getName(), "UTF-8"), 
                java.net.URLEncoder.encode(user.getRole().name(), "UTF-8"));
            
            response.sendRedirect(redirectUrl);
            
        } catch (Exception e) {
            System.err.println("❌ Google OAuth callback failed: " + e.getMessage());
            e.printStackTrace();
            
            try {
                response.sendRedirect("http://localhost:3000/auth/google/error?message=" + e.getMessage());
            } catch (IOException ioException) {
                System.err.println("❌ Failed to redirect to error page: " + ioException.getMessage());
            }
        }
    }

    /**
     * Google OAuth Login - Direct Token Exchange (Login Only - No Auto-Signup)
     */
    @PostMapping("/google/token")
    public ResponseEntity<?> googleTokenLogin(@RequestBody Map<String, String> request) {
        try {
            String authorizationCode = request.get("code");
            
            if (authorizationCode == null || authorizationCode.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Authorization code is required");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Get user info from Google
            GoogleOAuthService.GoogleUserInfo googleUserInfo = googleOAuthService.getUserInfo(authorizationCode);
            
            // Find existing user - DO NOT auto-create
            User user = userService.findByEmailSafe(googleUserInfo.getEmail());
            
            if (user == null) {
                // Don't auto-create user - require explicit signup
                System.out.println("❌ Google user not found, signup required: " + googleUserInfo.getEmail());
                
                Map<String, String> error = new HashMap<>();
                error.put("message", "Account not found. Please sign up first using Google Sign Up.");
                error.put("needsSignup", "true");
                error.put("email", googleUserInfo.getEmail());
                return ResponseEntity.badRequest().body(error);
            } else {
                // Update existing user with Google info
                user.setGoogleId(googleUserInfo.getId());
                user.setProfilePictureUrl(googleUserInfo.getPicture());
                if (user.getAuthProvider() == User.AuthProvider.LOCAL) {
                    user.setAuthProvider(User.AuthProvider.GOOGLE);
                }
                user = userService.save(user);
                System.out.println("✅ Existing user logged in with Google: " + user.getEmail());
            }
            
            // Generate JWT token
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(user.getEmail());
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", user.getRole().name());
            claims.put("userId", user.getId());
            String token = jwtUtil.generateToken(userDetails, claims);
            
            // Return authentication response
            AuthResponse.UserResponse userResponse = new AuthResponse.UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getEstablishmentType()
            );
            
            AuthResponse authResponse = new AuthResponse(token, userResponse);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Google login successful");
            response.put("user", authResponse);
            response.put("profilePicture", user.getProfilePictureUrl());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Google token login failed: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, String> error = new HashMap<>();
            error.put("message", "Google login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/google/signup")
    public ResponseEntity<?> googleSignup(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String name = request.get("name");
            String googleId = request.get("googleId");
            String profilePicture = request.get("picture");
            
            System.out.println("=== Google Signup Request ===");
            System.out.println("Email: " + email);
            System.out.println("Name: " + name);
            System.out.println("Google ID: " + googleId);
            
            if (email == null || name == null || googleId == null) {
                System.err.println("❌ Missing required Google user information");
                Map<String, String> error = new HashMap<>();
                error.put("message", "Missing required Google user information");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Check if user already exists
            User existingUser = userService.findByEmailSafe(email);
            if (existingUser != null) {
                System.err.println("❌ User already exists: " + email);
                Map<String, String> error = new HashMap<>();
                error.put("message", "User already exists. Please sign in instead.");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Create new user with Google OAuth
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(""); // No password for OAuth users
            user.setGoogleId(googleId);
            user.setProfilePictureUrl(profilePicture);
            user.setAuthProvider(User.AuthProvider.GOOGLE);
            user.setRole(com.opennova.model.UserRole.USER);
            user.setIsActive(true);
            
            user = userService.save(user);
            System.out.println("✅ New Google user created via signup confirmation: " + user.getEmail());
            
            // Generate JWT token with proper claims
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", user.getRole().name());
            claims.put("userId", user.getId());
            
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(user.getEmail());
            String token = jwtUtil.generateToken(userDetails, claims);
            
            // Return authentication response
            AuthResponse.UserResponse userResponse = new AuthResponse.UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getEstablishmentType()
            );
            
            AuthResponse authResponse = new AuthResponse(token, userResponse);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Google signup successful");
            response.put("token", token);
            response.put("user", authResponse);
            response.put("profilePicture", user.getProfilePictureUrl());
            
            System.out.println("✅ Google signup response prepared successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Google signup failed: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, String> error = new HashMap<>();
            error.put("message", "Google signup failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}