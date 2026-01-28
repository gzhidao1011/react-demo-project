package com.example.user.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 安全响应头过滤器
 * 为所有 HTTP 响应添加安全响应头，提升应用安全性
 * 
 * 参考：
 * - OWASP Secure Headers Project
 * - MDN Web Security Headers
 */
@Component
@Order(1) // 确保在其他过滤器之前执行
public class SecurityHeadersFilter implements Filter {
    
    /**
     * X-Content-Type-Options: nosniff
     * 防止浏览器 MIME 类型嗅探攻击
     */
    private static final String X_CONTENT_TYPE_OPTIONS = "X-Content-Type-Options";
    private static final String X_CONTENT_TYPE_OPTIONS_VALUE = "nosniff";
    
    /**
     * X-Frame-Options: DENY
     * 防止点击劫持攻击（Clickjacking）
     */
    private static final String X_FRAME_OPTIONS = "X-Frame-Options";
    private static final String X_FRAME_OPTIONS_VALUE = "DENY";
    
    /**
     * X-XSS-Protection: 1; mode=block
     * 启用浏览器 XSS 过滤器（虽然现代浏览器已内置，但保留以兼容旧浏览器）
     */
    private static final String X_XSS_PROTECTION = "X-XSS-Protection";
    private static final String X_XSS_PROTECTION_VALUE = "1; mode=block";
    
    /**
     * Strict-Transport-Security: max-age=31536000
     * 强制使用 HTTPS（HSTS），有效期 1 年
     * 注意：仅在 HTTPS 请求时添加此头
     */
    private static final String STRICT_TRANSPORT_SECURITY = "Strict-Transport-Security";
    private static final String STRICT_TRANSPORT_SECURITY_VALUE = "max-age=31536000; includeSubDomains";
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // 无需初始化
    }
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // 1. 添加 X-Content-Type-Options
        httpResponse.setHeader(X_CONTENT_TYPE_OPTIONS, X_CONTENT_TYPE_OPTIONS_VALUE);
        
        // 2. 添加 X-Frame-Options
        httpResponse.setHeader(X_FRAME_OPTIONS, X_FRAME_OPTIONS_VALUE);
        
        // 3. 添加 X-XSS-Protection
        httpResponse.setHeader(X_XSS_PROTECTION, X_XSS_PROTECTION_VALUE);
        
        // 4. 添加 Strict-Transport-Security（仅在 HTTPS 时添加）
        if (httpRequest.isSecure()) {
            httpResponse.setHeader(STRICT_TRANSPORT_SECURITY, STRICT_TRANSPORT_SECURITY_VALUE);
        }
        
        // 继续过滤器链
        chain.doFilter(request, response);
    }
    
    @Override
    public void destroy() {
        // 无需清理
    }
}
