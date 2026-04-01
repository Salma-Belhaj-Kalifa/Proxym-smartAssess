package com.example.smart_assess.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = TunisianPhoneValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidTunisianPhone {
    String message() default "Le numéro de téléphone doit contenir exactement 8 chiffres";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
}
