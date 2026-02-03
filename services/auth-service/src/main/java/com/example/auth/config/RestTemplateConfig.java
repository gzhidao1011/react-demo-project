package com.example.auth.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate 配置，用于调用 user-service 内部 API
 * @LoadBalanced 使 RestTemplate 通过 Nacos 解析服务名（如 http://user-service）
 * 使用 HttpComponentsClientHttpRequestFactory 以支持 PATCH（HttpURLConnection 不支持 PATCH）
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        return new RestTemplate(new HttpComponentsClientHttpRequestFactory());
    }
}
