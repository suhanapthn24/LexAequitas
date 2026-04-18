package com.lexaequitas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.lexaequitas.model.User;
import com.lexaequitas.repository.UserRepository;
import com.lexaequitas.config.JwtUtil;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder encoder;

    @Autowired
    private JwtUtil jwtUtil;

    public String register(User user) {

        String email = user.getEmail().toLowerCase(); // ✅ normalize
        user.setEmail(email);

        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        user.setPassword(encoder.encode(user.getPassword()));

        userRepository.save(user);

        return "User registered successfully";
    }

    public String login(User request) {

        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        System.out.println("INPUT PASSWORD: [" + request.getPassword() + "]");
        System.out.println("MATCH RESULT: " + encoder.matches(request.getPassword(), user.getPassword()));

        if (!encoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return jwtUtil.generateToken(user.getEmail());
    }
}