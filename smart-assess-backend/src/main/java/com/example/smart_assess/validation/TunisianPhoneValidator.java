package com.example.smart_assess.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class TunisianPhoneValidator implements ConstraintValidator<ValidTunisianPhone, String> {

    @Override
    public void initialize(ValidTunisianPhone constraintAnnotation) {
        // Pas d'initialisation nécessaire
    }

    @Override
    public boolean isValid(String phone, ConstraintValidatorContext context) {
        log.debug("🔍 Validation du téléphone: '{}'", phone);
        
        if (phone == null) {
            log.debug("❌ Téléphone null -> invalide");
            return false; // Le téléphone est obligatoire
        }
        
        // Supprimer tous les caractères non numériques
        String cleanPhone = phone.replaceAll("[^0-9]", "");
        log.debug("🧹 Téléphone nettoyé: '{}'", cleanPhone);
        log.debug("📏 Longueur: {}", cleanPhone.length());
        log.debug("🔢 Format numérique: {}", cleanPhone.matches("\\d{8}"));
        
        // Vérifier que c'est exactement 8 chiffres
        boolean isValid = cleanPhone.length() == 8 && cleanPhone.matches("\\d{8}");
        log.debug("✅ Résultat validation: {}", isValid);
        
        return isValid;
    }
}
