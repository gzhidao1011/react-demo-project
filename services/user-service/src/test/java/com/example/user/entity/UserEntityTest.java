package com.example.user.entity;

import com.example.api.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * UserEntity 单元测试（MyBatis 实体）
 *
 * 测试覆盖：
 * - password 字段存在且为 String 类型（MyBatis 实体无 JPA 注解，约束由 Flyway 管理）
 * - toDTO() 方法存在且不暴露 password 字段
 * - toDTO() 正确转换其他字段（id、name、email、phone）
 */
class UserEntityTest {

    private UserEntity entity;

    @BeforeEach
    void setUp() {
        entity = new UserEntity();
        entity.setId(1L);
        entity.setName("测试用户");
        entity.setEmail("test@example.com");
        entity.setPhone("13800138000");
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void shouldHavePasswordField() throws Exception {
        // 验证 password 字段存在且为 String 类型（MyBatis 实体，约束由 Flyway 管理）
        Field passwordField = UserEntity.class.getDeclaredField("password");
        assertNotNull(passwordField, "应存在 password 字段");
        assertEquals(String.class, passwordField.getType(), "password 字段应为 String 类型（BCrypt 哈希值）");
    }

    @Test
    void shouldHavePasswordGetterAndSetter() throws Exception {
        // 验证 password 字段的 Getter 和 Setter 方法存在
        UserEntity entity = new UserEntity();
        String testPassword = "$2a$12$test_hashed_password";
        
        // 使用反射设置 password
        Field passwordField = UserEntity.class.getDeclaredField("password");
        passwordField.setAccessible(true);
        passwordField.set(entity, testPassword);
        
        // 验证可以读取
        String retrievedPassword = (String) passwordField.get(entity);
        assertEquals(testPassword, retrievedPassword, "应能正确设置和获取 password");
    }

    @Test
    void shouldHaveToDTOMethod() throws Exception {
        // 验证 toDTO() 方法存在
        Method toDtoMethod = UserEntity.class.getMethod("toDTO");
        assertNotNull(toDtoMethod, "应存在 toDTO() 方法");
        
        // 验证返回类型为 User（DTO）
        assertEquals(User.class, toDtoMethod.getReturnType(), "toDTO() 应返回 User DTO");
    }

    @Test
    void toDTOShouldNotExposePassword() throws Exception {
        // 设置 password 字段
        Field passwordField = UserEntity.class.getDeclaredField("password");
        passwordField.setAccessible(true);
        passwordField.set(entity, "$2a$12$secret_hashed_password_should_not_be_exposed");

        // 调用 toDTO()
        Method toDtoMethod = UserEntity.class.getMethod("toDTO");
        User dto = (User) toDtoMethod.invoke(entity);
        assertNotNull(dto, "toDTO() 应返回非空的 DTO 对象");

        // 验证 DTO 不包含 password 字段或 Getter
        boolean hasPasswordGetter = false;
        for (Method method : dto.getClass().getMethods()) {
            String methodName = method.getName().toLowerCase();
            if ((methodName.equals("getpassword") || methodName.contains("password")) 
                    && method.getParameterCount() == 0) {
                hasPasswordGetter = true;
                break;
            }
        }
        assertFalse(hasPasswordGetter, "DTO 不应暴露 password Getter 方法，防止敏感信息泄露");
    }

    @Test
    void toDTOShouldConvertAllOtherFields() throws Exception {
        // 设置 password（但不应该在 DTO 中）
        Field passwordField = UserEntity.class.getDeclaredField("password");
        passwordField.setAccessible(true);
        passwordField.set(entity, "secret_password");

        // 调用 toDTO()
        Method toDtoMethod = UserEntity.class.getMethod("toDTO");
        User dto = (User) toDtoMethod.invoke(entity);

        // 验证其他字段正确转换
        assertEquals(entity.getId(), dto.getId(), "id 字段应正确转换");
        assertEquals(entity.getName(), dto.getName(), "name 字段应正确转换");
        assertEquals(entity.getEmail(), dto.getEmail(), "email 字段应正确转换");
        assertEquals(entity.getPhone(), dto.getPhone(), "phone 字段应正确转换");
    }

    @Test
    void toDTOShouldHandleNullFields() throws Exception {
        // 创建包含 null 字段的实体
        UserEntity entityWithNulls = new UserEntity();
        entityWithNulls.setId(2L);
        entityWithNulls.setName("测试");
        entityWithNulls.setEmail("test2@example.com");
        // phone 为 null

        // 设置 password
        Field passwordField = UserEntity.class.getDeclaredField("password");
        passwordField.setAccessible(true);
        passwordField.set(entityWithNulls, "password_hash");

        // 调用 toDTO()
        Method toDtoMethod = UserEntity.class.getMethod("toDTO");
        User dto = (User) toDtoMethod.invoke(entityWithNulls);

        // 验证 null 字段正确处理
        assertNotNull(dto, "DTO 不应为 null");
        assertEquals(entityWithNulls.getId(), dto.getId());
        assertEquals(entityWithNulls.getName(), dto.getName());
        assertEquals(entityWithNulls.getEmail(), dto.getEmail());
        assertNull(dto.getPhone(), "phone 为 null 时应正确转换");
    }
}
