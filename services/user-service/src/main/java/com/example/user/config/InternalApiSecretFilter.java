package com.example.user.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 内部 API 鉴权：仅允许携带正确 X-Internal-Secret 的请求访问 /internal/**
 */
@Component
@Order(1)
public class InternalApiSecretFilter extends OncePerRequestFilter implements Ordered {

    private static final int ORDER = 1;
    private static final String INTERNAL_PATH_PREFIX = "/internal/";

    @Override
    public int getOrder() {
        return ORDER;
    }
    private static final String HEADER_INTERNAL_SECRET = "X-Internal-Secret";

    @Value("${internal.api.secret:}")
    private String expectedSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        if (!path.startsWith(INTERNAL_PATH_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }
        String secret = request.getHeader(HEADER_INTERNAL_SECRET);
        if (expectedSecret.isEmpty() || !expectedSecret.equals(secret)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":403,\"message\":\"无权限访问内部 API\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
