package com.example.smart_assess.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    // ==========================================
    // METHODE GENERIQUE UTILISEE PAR CONTROLLER
    // ==========================================
    public void sendEmail(String toEmail, String subject, String content) {
        sendSimpleEmail(toEmail, subject, content);
    }

    // ==========================================
    // EMAIL TEST TECHNIQUE HTML
    // ==========================================
    public void sendTestEmail(String toEmail,
                              String candidateName,
                              String testToken,
                              String positionTitle,
                              LocalDateTime expirationDate) {
        try {
            log.info("Envoi email test à {}", toEmail);

            Context context = new Context();
            context.setVariable("candidateName", candidateName);
            context.setVariable("testLink", frontendUrl + "/candidate/test/" + testToken);
            context.setVariable("positionTitle", positionTitle);
            context.setVariable("expirationDate",
                    expirationDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm")));
            context.setVariable("companyName", "PROXYM SmartAssess");

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("📋 Test technique - " + positionTitle + " | PROXYM SmartAssess");

            String htmlContent = templateEngine.process("test-email", context);

            helper.setText(htmlContent, true);

            mailSender.send(message);

            log.info("Email test envoyé avec succès à {}", toEmail);

        } catch (MessagingException e) {
            log.error("Erreur envoi email test", e);
            throw new RuntimeException("Impossible d'envoyer email test", e);
        }
    }

    // ==========================================
    // EMAIL SIMPLE TEXTE
    // ==========================================
    public void sendSimpleEmail(String toEmail, String subject, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();

            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(content);

            mailSender.send(message);

            log.info("Email simple envoyé à {}", toEmail);

        } catch (Exception e) {
            log.error("Erreur email simple", e);
            throw new RuntimeException("Impossible d'envoyer email", e);
        }
    }

    // ==========================================
    // EMAIL HTML GENERIQUE
    // ==========================================
    public void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);

            log.info("Email HTML envoyé à {}", toEmail);

        } catch (MessagingException e) {
            log.error("Erreur email HTML", e);
            throw new RuntimeException("Impossible d'envoyer email HTML", e);
        }
    }
}