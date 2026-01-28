package com.example.user.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 过滤器配置类
 * 注册自定义过滤器并设置执行顺序
 */
@Configuration
public class FilterConfig {
    
    /**
     * 注册安全响应头过滤器
     * 确保在所有请求处理之前添加安全响应头
     * 
     * @param securityHeadersFilter 安全响应头过滤器
     * @return 过滤器注册 Bean
     */
    @Bean
    public FilterRegistrationBean<SecurityHeadersFilter> securityHeadersFilterRegistration(
            SecurityHeadersFilter securityHeadersFilter) {
        FilterRegistrationBean<SecurityHeadersFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(securityHeadersFilter);
        registration.addUrlPatterns("/*"); // 匹配所有 URL
        registration.setOrder(1); // 设置执行顺序，数字越小越先执行
        registration.setName("securityHeadersFilter");
        return registration;
    }
}
