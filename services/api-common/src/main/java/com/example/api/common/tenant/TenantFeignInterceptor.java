package com.example.api.common.tenant;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.stereotype.Component;

/**
 * Feign 租户拦截器
 * 在 Feign 调用时自动传递租户ID
 */
@Component
public class TenantFeignInterceptor implements RequestInterceptor {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    @Override
    public void apply(RequestTemplate template) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            template.header(TENANT_HEADER, tenantId);
        }
    }
}
