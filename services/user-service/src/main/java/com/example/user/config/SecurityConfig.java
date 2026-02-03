package com.example.user.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import jakarta.servlet.http.HttpServletResponse;

/**
 * 安全配置类
 * 配置密码加密器、JWT 认证过滤器和其他安全相关 Bean
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final InternalApiSecretFilter internalApiSecretFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, InternalApiSecretFilter internalApiSecretFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.internalApiSecretFilter = internalApiSecretFilter;
    }
    
    /**
     * 密码加密器 Bean
     * 使用 BCrypt 算法，成本因子 12（推荐值）
     * 
     * BCrypt 成本因子说明：
     * - 10: 快速，适合开发环境
     * - 12: 推荐值，平衡安全性和性能
     * - 15+: 高安全性，但性能较慢
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
    
    /**
     * 安全过滤器链配置
     * 允许认证接口公开访问，其他接口需要认证
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // 禁用 CSRF（API 使用 JWT，不需要 CSRF）
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // 无状态会话
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"code\":401,\"message\":\"未授权，请登录\"}");
                }))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(AntPathRequestMatcher.antMatcher("/internal/**")).permitAll() // 内部 API 由 InternalApiSecretFilter 校验
                .requestMatchers(AntPathRequestMatcher.antMatcher("/actuator/health")).permitAll() // 健康检查公开访问
                .anyRequest().authenticated() // 其他接口需 JWT 认证（/api/users/**、/api/user/** 等，JWT 由 auth-service 签发）
            )
            // 均以内置 filter 为参考，避免「does not have a registered order」；后添加的在前执行
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(internalApiSecretFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    
    /**
     * 使用示例：
     * 
     * // 加密密码
     * String rawPassword = "userPassword123";
     * String encodedPassword = passwordEncoder.encode(rawPassword);
     * 
     * // 验证密码
     * boolean matches = passwordEncoder.matches(rawPassword, encodedPassword);
     */
}
