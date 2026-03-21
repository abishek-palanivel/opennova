package com.opennova.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        // Skip JWT processing for OPTIONS requests (CORS preflight)
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        // Skip JWT processing for public endpoints, but NOT for profile endpoint
        String requestPath = request.getRequestURI();
        if (requestPath.startsWith("/api/public/") || 
            requestPath.startsWith("/api/chat/guest/") ||
            requestPath.startsWith("/api/files/") ||
            requestPath.equals("/error") ||
            requestPath.equals("/favicon.ico") ||
            (requestPath.startsWith("/api/auth/") && !requestPath.equals("/api/auth/profile"))) {
            chain.doFilter(request, response);
            return;
        }

        final String requestTokenHeader = request.getHeader("Authorization");

        String username = null;
        String jwtToken = null;
        boolean tokenValid = false;

        // JWT Token is in the form "Bearer token". Remove Bearer word and get only the Token
        if (requestTokenHeader != null && requestTokenHeader.startsWith("Bearer ")) {
            jwtToken = requestTokenHeader.substring(7);
            try {
                // First validate token format and signature
                if (jwtUtil.validateToken(jwtToken)) {
                    username = jwtUtil.extractUsername(jwtToken);
                    tokenValid = true;
                } else {
                    logger.warn("Invalid JWT token format or signature");
                    SecurityContextHolder.clearContext();
                }
            } catch (Exception e) {
                logger.warn("Failed to process JWT token: " + e.getMessage());
                SecurityContextHolder.clearContext();
            }
        } else if (requestPath.equals("/api/auth/profile")) {
            // Profile endpoint requires authentication but no token provided
            logger.warn("No Authorization header found for protected endpoint: " + requestPath);
        }

        // Once we get the token validate it.
        if (username != null && tokenValid && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

                // if token is valid configure Spring Security to manually set authentication
                if (jwtUtil.validateToken(jwtToken, userDetails)) {
                    UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    usernamePasswordAuthenticationToken
                            .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    // After setting the Authentication in the context, we specify
                    // that the current user is authenticated. So it passes the
                    // Spring Security Configurations successfully.
                    SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
                    logger.debug("Successfully authenticated user: " + username);
                } else {
                    logger.warn("Token validation failed for user: " + username);
                    SecurityContextHolder.clearContext();
                }
            } catch (Exception e) {
                logger.warn("Failed to authenticate user: " + username + " - " + e.getMessage());
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}