package com.taskflow.controller;

import com.taskflow.dto.AuthRequest;
import com.taskflow.dto.AuthResponse;
import com.taskflow.dto.RegisterRequest;
import com.taskflow.model.User;
import com.taskflow.repository.UserRepository;
import com.taskflow.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            if (userRepository.existsByUsername(request.getUsername())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
            }

            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email already exists"));
            }

            User user = new User();
            user.setUsername(request.getUsername());
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setFullName(request.getFullName());

            userRepository.save(user);

            final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
            final String jwt = jwtUtil.generateToken(userDetails);

            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("username", user.getUsername());
            userData.put("email", user.getEmail());

            return ResponseEntity.ok(new AuthResponse(jwt, userData));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
            final String jwt = jwtUtil.generateToken(userDetails);

            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("username", user.getUsername());
            userData.put("email", user.getEmail());

            return ResponseEntity.ok(new AuthResponse(jwt, userData));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid username or password"));
        }
    }
}