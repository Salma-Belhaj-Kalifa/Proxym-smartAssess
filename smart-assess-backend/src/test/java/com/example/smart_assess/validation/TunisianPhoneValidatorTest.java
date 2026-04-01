package com.example.smart_assess.validation;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class TunisianPhoneValidatorTest {

    private final TunisianPhoneValidator validator = new TunisianPhoneValidator();

    @Test
    void testValidPhones() {
        assertTrue(validator.isValid("12345678", null));  // 8 chiffres
        assertTrue(validator.isValid("98765432", null));  // 8 chiffres
        assertTrue(validator.isValid("21612345678", null));  // Avec préfixe tunisien
        assertTrue(validator.isValid("+21612345678", null));  // Avec + et préfixe
        assertTrue(validator.isValid("0021612345678", null));  // Avec 00 et préfixe
        assertTrue(validator.isValid(" 12345678 ", null));  // Avec espaces
    }

    @Test
    void testInvalidPhones() {
        assertFalse(validator.isValid(null, null));  // Null
        assertFalse(validator.isValid("", null));  // Vide
        assertFalse(validator.isValid("1234567", null));  // 7 chiffres
        assertFalse(validator.isValid("123456789", null));  // 9 chiffres
        assertFalse(validator.isValid("1234567890", null));  // 10 chiffres
        assertFalse(validator.isValid("abcdefgh", null));  // Lettres
        assertFalse(validator.isValid("1234abcd", null));  // Mixte
        assertFalse(validator.isValid("123-456-78", null));  // Avec tirets
        assertFalse(validator.isValid("123 456 78", null));  // Espaces internes
    }

    @Test
    void testEdgeCases() {
        assertTrue(validator.isValid("00000000", null));  // Zéros
        assertTrue(validator.isValid("99999999", null));  // Neufs
        
        // Cas avec caractères spéciaux mais 8 chiffres au total
        assertTrue(validator.isValid("(216)12345678", null));  // Parenthèses
        assertTrue(validator.isValid("216.123.456.78", null));  // Points
    }
}
