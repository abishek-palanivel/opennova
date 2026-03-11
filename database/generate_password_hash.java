// Quick utility to generate BCrypt password hash
// Compile and run: javac generate_password_hash.java && java generate_password_hash

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class generate_password_hash {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "Abi@1234";
        String hash = encoder.encode(password);
        System.out.println("Password: " + password);
        System.out.println("BCrypt Hash: " + hash);
    }
}
