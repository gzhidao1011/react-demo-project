package com.example.user.controller;

import com.example.user.entity.AuditLogEntity;
import com.example.user.mapper.AuditLogMapper;
import com.example.user.mapper.UserMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 用户管理 API 集成测试（TDD：与设计文档 2.4 一致）
 * GET /api/users 分页、GET /api/users/{id}、POST 201+Location、PUT、DELETE 软删除、PATCH restore；
 * GET /api/roles 分页、GET /api/roles/{id}、POST/PUT/DELETE；GET /api/permissions
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Testcontainers
@TestPropertySource(properties = {
    "spring.cloud.nacos.discovery.enabled=false",
    "spring.cloud.nacos.config.enabled=false",
    "spring.kafka.enabled=false",
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration",
    "dubbo.application.name=test",
    "dubbo.registry.address=N/A",
    "dubbo.protocol.port=-1",
    "jwt.algorithm=RS256",
    "jwt.private-key-path=classpath:keys/private.pem",
    "jwt.public-key-path=classpath:keys/public.pem",
    "jwt.access-token-expiration=1800",
    "jwt.refresh-token-expiration=604800",
    "jwt.issuer=https://auth.example.com",
    "jwt.audience=api.example.com",
    "spring.data.redis.password=",
    "spring.data.redis.database=15",
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=MySQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.flyway.enabled=false",
    "spring.sql.init.mode=always",
    "spring.sql.init.data-locations=classpath:data.sql",
    "resend.api-key=",
    "rate-limit.verify-email.max-attempts-per-ip=20",
    "rate-limit.forgot-password.max-attempts-per-ip=20"
})
class UserManagementControllerIntegrationTest {

    @Container
    static GenericContainer<?> redis =
            new GenericContainer<>(DockerImageName.parse("redis:7-alpine")).withExposedPorts(6379);

    @DynamicPropertySource
    static void redisProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> String.valueOf(redis.getFirstMappedPort()));
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private AuditLogMapper auditLogMapper;

    @Autowired
    private com.example.user.mapper.RoleMapper roleMapper;

    @BeforeEach
    void setUp() {
        userMapper.deleteAll();
    }

    // ========== 用户管理 API ==========

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUsers_shouldReturnPagedResult() throws Exception {
        mockMvc.perform(get("/api/users").param("page", "1").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.total").exists())
                .andExpect(jsonPath("$.data.page").value(1))
                .andExpect(jsonPath("$.data.size").value(20));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void postUser_shouldReturn201WithLocation() throws Exception {
        com.example.user.controller.dto.CreateUserRequest user = new com.example.user.controller.dto.CreateUserRequest();
        user.setName("测试用户");
        user.setEmail("admin-test@example.com");
        user.setPhone("13800000000");
        user.setPassword("Password123!");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.containsString("/api/users/")))
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.email").value("admin-test@example.com"));
    }

    /**
     * TDD：与设计文档 2.7 一致，用户创建成功后应写入审计日志（谁在何时对何资源做了何操作）
     */
    @Test
    void postUser_shouldWriteAuditLog() throws Exception {
        // 先插入操作人（actor），请求时用 with(user(actorId)) 使 Service 能解析出当前操作人
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        com.example.user.entity.UserEntity actor = new com.example.user.entity.UserEntity();
        actor.setName("Admin");
        actor.setEmail("admin@audit-test.com");
        actor.setPassword("encoded");
        actor.setEmailVerified(true);
        actor.setCreatedAt(now);
        actor.setUpdatedAt(now);
        actor.setDeletedAt(null);
        userMapper.insert(actor);
        long actorId = actor.getId();

        com.example.user.controller.dto.CreateUserRequest req = new com.example.user.controller.dto.CreateUserRequest();
        req.setName("被创建用户");
        req.setEmail("created@audit-test.com");
        req.setPassword("Password123!");
        String resBody = mockMvc.perform(post("/api/users")
                        .with(user(String.valueOf(actorId)).roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        long createdId = objectMapper.readTree(resBody).get("data").get("id").asLong();

        java.util.List<AuditLogEntity> logs = auditLogMapper.findPage(null, "user", 0, 10);
        org.hamcrest.MatcherAssert.assertThat("应至少有一条审计记录", logs.size(), org.hamcrest.Matchers.greaterThanOrEqualTo(1));
        AuditLogEntity createdLog = logs.stream()
                .filter(l -> "user.created".equals(l.getAction()) && String.valueOf(createdId).equals(l.getResourceId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("未找到 user.created 审计记录"));
        org.junit.jupiter.api.Assertions.assertEquals(Long.valueOf(actorId), createdLog.getActorId());
        org.junit.jupiter.api.Assertions.assertEquals("admin@audit-test.com", createdLog.getActorEmail());
        org.junit.jupiter.api.Assertions.assertEquals("user", createdLog.getResourceType());
        org.junit.jupiter.api.Assertions.assertNull(createdLog.getOldValue());
        org.junit.jupiter.api.Assertions.assertNotNull(createdLog.getNewValue());
        org.junit.jupiter.api.Assertions.assertFalse(createdLog.getNewValue().contains("password"), "审计 new_value 不应包含密码");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteUser_shouldSoftDeleteAndReturn204() throws Exception {
        var now = java.time.LocalDateTime.now();
        com.example.user.entity.UserEntity entity = new com.example.user.entity.UserEntity();
        entity.setName("待删");
        entity.setEmail("todelete@example.com");
        entity.setPassword("encoded");
        entity.setEmailVerified(false);
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        userMapper.insert(entity);
        Long id = entity.getId();

        mockMvc.perform(delete("/api/users/" + id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/users/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void patchRestore_shouldRestoreSoftDeletedUser() throws Exception {
        var now = java.time.LocalDateTime.now();
        com.example.user.entity.UserEntity entity = new com.example.user.entity.UserEntity();
        entity.setName("已删");
        entity.setEmail("restore@example.com");
        entity.setPassword("encoded");
        entity.setEmailVerified(false);
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        userMapper.insert(entity);
        Long id = entity.getId();
        userMapper.softDeleteById(id, now);

        mockMvc.perform(patch("/api/users/" + id + "/restore"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/users/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("restore@example.com"));
    }

    // ========== 角色管理 API ==========

    @Test
    @WithMockUser(roles = "ADMIN")
    void getRoles_shouldReturnPagedResult() throws Exception {
        mockMvc.perform(get("/api/roles").param("page", "1").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.total").exists())
                .andExpect(jsonPath("$.data.page").value(1))
                .andExpect(jsonPath("$.data.size").value(20));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getRoleById_shouldReturnRoleWithPermissions() throws Exception {
        mockMvc.perform(get("/api/roles/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.code").value("ADMIN"))
                .andExpect(jsonPath("$.data.permissions").isArray());
    }

    /** TDD：与设计文档 2.4 一致，角色支持 PATCH /api/roles/{id}/restore 恢复软删除 */
    @Test
    @WithMockUser(roles = "ADMIN")
    void patchRestoreRole_shouldRestoreSoftDeletedRole() throws Exception {
        // 使用 data.sql 中已有的角色 2 (USER)，软删除后恢复
        roleMapper.softDelete(2L, java.time.LocalDateTime.now());
        mockMvc.perform(patch("/api/roles/2/restore"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
        mockMvc.perform(get("/api/roles/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code").value("USER"));
    }

    /**
     * TDD：与设计文档 2.4、2.7 一致，PUT /api/roles/{id}/permissions 幂等替换角色权限，并写入审计日志
     */
    @Test
    void putRolePermissions_shouldUpdateAndWriteAudit() throws Exception {
        // 插入操作人以便审计记录有 actor
        var now = java.time.LocalDateTime.now();
        com.example.user.entity.UserEntity actor = new com.example.user.entity.UserEntity();
        actor.setName("Admin");
        actor.setEmail("admin@perm-test.com");
        actor.setPassword("encoded");
        actor.setEmailVerified(true);
        actor.setCreatedAt(now);
        actor.setUpdatedAt(now);
        actor.setDeletedAt(null);
        userMapper.insert(actor);
        long actorId = actor.getId();

        // data.sql 中角色 2 (USER) 无 role_permissions；绑定权限 [1, 3]
        String body = objectMapper.writeValueAsString(java.util.Map.of("permissionIds", java.util.List.of(1L, 3L)));
        mockMvc.perform(put("/api/roles/2/permissions")
                        .with(user(String.valueOf(actorId)).roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));

        // 验证角色权限已更新
        mockMvc.perform(get("/api/roles/2").with(user(String.valueOf(actorId)).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.permissions").isArray())
                .andExpect(jsonPath("$.data.permissions.length()").value(2));

        // 验证审计日志有 role.permissions.updated
        java.util.List<AuditLogEntity> logs = auditLogMapper.findPage(null, "role", 0, 10);
        AuditLogEntity permLog = logs.stream()
                .filter(l -> "role.permissions.updated".equals(l.getAction()) && "2".equals(l.getResourceId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("未找到 role.permissions.updated 审计记录"));
        org.junit.jupiter.api.Assertions.assertEquals(Long.valueOf(actorId), permLog.getActorId());
        org.junit.jupiter.api.Assertions.assertEquals("admin@perm-test.com", permLog.getActorEmail());
    }

    // ========== 权限管理 API ==========

    @Test
    @WithMockUser(roles = "ADMIN")
    void getPermissions_shouldReturnList() throws Exception {
        mockMvc.perform(get("/api/permissions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data").isArray());
    }

    /** TDD：与设计文档 2.5 一致，非 ADMIN 访问管理 API 应返回 403 */
    @Test
    @WithMockUser(roles = "USER")
    void getUsers_withNonAdmin_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/users").param("page", "1").param("size", "20"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUsers_withoutAuth_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/users").param("page", "1").param("size", "20"))
                .andExpect(status().isUnauthorized());
    }
}
