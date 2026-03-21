package com.opennova.security;

import com.opennova.model.User;
import com.opennova.service.UserService;
import com.opennova.service.EstablishmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserService userService;
    
    @Autowired
    private EstablishmentService establishmentService;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        try {
            User user = userService.findByEmailSafe(email);
            if (user == null) {
                throw new UsernameNotFoundException("User not found with email: " + email);
            }
            
            // Check if user is active
            if (!user.getIsActive()) {
                throw new UsernameNotFoundException("User account is suspended: " + email);
            }
            
            // For owner roles, also check if their establishment is active
            if (user.getRole() == com.opennova.model.UserRole.OWNER ||
                user.getRole() == com.opennova.model.UserRole.HOTEL_OWNER ||
                user.getRole() == com.opennova.model.UserRole.HOSPITAL_OWNER ||
                user.getRole() == com.opennova.model.UserRole.SHOP_OWNER) {
                
                try {
                    com.opennova.model.Establishment establishment = establishmentService.findByOwner(user);
                    if (establishment != null && !establishment.getIsActive()) {
                        System.err.println("❌ Establishment is suspended for user: " + email);
                        throw new UsernameNotFoundException("Your establishment has been suspended. Please contact support.");
                    }
                } catch (Exception e) {
                    System.err.println("Error checking establishment status: " + e.getMessage());
                    // Continue with login if establishment check fails
                }
            }

            return new CustomUserPrincipal(user);
        } catch (Exception e) {
            System.err.println("Error loading user by username: " + e.getMessage());
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
    }

    public static class CustomUserPrincipal implements UserDetails {
        private User user;

        public CustomUserPrincipal(User user) {
            this.user = user;
        }

        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
            List<GrantedAuthority> authorities = new ArrayList<>();
            // Add ROLE_ prefix to match Spring Security expectations and AdminController checks
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
            return authorities;
        }

        @Override
        public String getPassword() {
            return user.getPassword();
        }

        @Override
        public String getUsername() {
            return user.getEmail();
        }

        @Override
        public boolean isAccountNonExpired() {
            return true;
        }

        @Override
        public boolean isAccountNonLocked() {
            return true;
        }

        @Override
        public boolean isCredentialsNonExpired() {
            return true;
        }

        @Override
        public boolean isEnabled() {
            return user.getIsActive();
        }

        public User getUser() {
            return user;
        }
    }
}