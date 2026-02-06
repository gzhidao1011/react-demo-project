package com.example.api.common.tenant;

import com.zaxxer.hikari.HikariDataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * 多租户数据源配置
 * 根据配置动态创建各租户的数据源
 */
@Configuration
@ConditionalOnProperty(name = "multi-tenant.enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class TenantDataSourceConfig {

    private final TenantProperties tenantProperties;

    @Bean
    public DataSource dataSource() {
        TenantDataSourceRouter router = new TenantDataSourceRouter();

        Map<Object, Object> dataSources = new HashMap<>();

        // 默认数据源
        if (tenantProperties.getDefaultDatabase() != null) {
            dataSources.put("default", createDataSource(tenantProperties.getDefaultDatabase()));
            log.info("注册默认数据源");
        }

        // 各租户数据源
        if (tenantProperties.getTenants() != null) {
            tenantProperties.getTenants().forEach((tenantId, config) -> {
                if (config.getDatabase() != null) {
                    dataSources.put(tenantId, createDataSource(config.getDatabase()));
                    log.info("注册租户数据源: {}", tenantId);
                }
            });
        }

        router.setTargetDataSources(dataSources);
        if (dataSources.containsKey("default")) {
            router.setDefaultTargetDataSource(dataSources.get("default"));
        }

        return router;
    }

    private DataSource createDataSource(TenantProperties.DatabaseConfig config) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(config.getUrl());
        ds.setUsername(config.getUsername());
        ds.setPassword(config.getPassword());
        ds.setDriverClassName(config.getDriverClassName());
        ds.setMaximumPoolSize(config.getMaxPoolSize());
        ds.setMinimumIdle(config.getMinPoolSize());
        ds.setConnectionTimeout(config.getConnectionTimeout());
        ds.setIdleTimeout(config.getIdleTimeout());
        return ds;
    }
}
