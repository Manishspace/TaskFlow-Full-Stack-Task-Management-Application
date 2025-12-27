package com.taskflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class TaskFlowApplication {
    public static void main(String[] args) {
        SpringApplication.run(TaskFlowApplication.class, args);
        System.out.println("\n========================================");
        System.out.println("🚀 TaskFlow Backend Started Successfully!");
        System.out.println("📍 API: http://localhost:8080/api");
        System.out.println("🗄️  H2 Console: http://localhost:8080/h2-console");
        System.out.println("========================================\n");
    }
}