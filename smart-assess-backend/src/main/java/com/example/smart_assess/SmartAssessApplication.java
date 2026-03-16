package com.example.smart_assess;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.example.smart_assess.entity.Manager;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.repository.ManagerRepository;

@SpringBootApplication
public class SmartAssessApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmartAssessApplication.class, args);
	}

	@Bean
	public CommandLineRunner initData(ManagerRepository managerRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			// Vérifier si un manager existe déjà
			if (!managerRepository.existsByEmail("manager@test.com")) {
				Manager manager = Manager.builder()
					.email("manager@test.com")
					.password(passwordEncoder.encode("password123"))
					.firstName("Test")
					.lastName("Manager")
					.role(Role.MANAGER)
					.department("IT")
					.build();
				
				managerRepository.save(manager);
				System.out.println("=== MANAGER PAR DÉFAUT CRÉÉ ===");
				System.out.println("Email: manager@test.com");
				System.out.println("Password: password123");
				System.out.println("ID: " + manager.getId());
			} else {
				System.out.println("=== MANAGER PAR DÉFAUT DÉJÀ EXISTANT ===");
			}
		};
	}

}
