package com.example.api.common.tenant;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 租户拦截器
 * 从请求头中提取租户ID并设置到上下文
 */
@Component
@Slf4j
public class TenantInterceptor implements HandlerInterceptor {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    @Override
    public boolean preHandle(HttpServletRequest request, 
                           HttpServletResponse response, 
                           Object handler) throws Exception {
        String tenantId = request.getHeader(TENANT_HEADER);

        if (tenantId != null && !tenantId.isEmpty()) {
            TenantContext.setTenantId(tenantId);
            log.debug("租户上下文已设置: {}", tenantId);
            
            // 注意：实际应用中应从租户服务获取租户信息并验证
            // TenantInfo tenantInfo = tenantService.getTenantInfo(tenantId);
            // if (tenantInfo == null) {
            //     response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            //     response.getWriter().write("Tenant not found");
            //     return false;
            // }
            // if (tenantInfo.getStatus() != TenantInfo.TenantStatus.ACTIVE) {
            //     response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            //     response.getWriter().write("Tenant is not active");
            //     return false;
            // }
            // TenantContext.setTenantInfo(tenantInfo);
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, 
                               HttpServletResponse response, 
                               Object handler, 
                               Exception ex) {
        TenantContext.clear();
    }
}
