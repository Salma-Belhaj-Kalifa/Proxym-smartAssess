package com.example.smart_assess.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class RequestLoggingFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // Log request details
        System.out.println("=== REQUEST DEBUG ===");
        System.out.println("Method: " + httpRequest.getMethod());
        System.out.println("URL: " + httpRequest.getRequestURL());
        System.out.println("Content-Type: " + httpRequest.getContentType());
        System.out.println("Content-Length: " + httpRequest.getContentLength());
        
        // Log request body for POST/PUT
        if ("POST".equals(httpRequest.getMethod()) || "PUT".equals(httpRequest.getMethod())) {
            CachedBodyHttpServletRequest cachedRequest = new CachedBodyHttpServletRequest(httpRequest);
            String body = StreamUtils.copyToString(cachedRequest.getInputStream(), StandardCharsets.UTF_8);
            System.out.println("Body: " + body);
            chain.doFilter(cachedRequest, response);
        } else {
            chain.doFilter(request, response);
        }
    }
}
