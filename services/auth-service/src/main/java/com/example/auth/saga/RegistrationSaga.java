package com.example.auth.saga;

import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import com.example.api.model.RegisterRequest;
import com.example.api.model.RegisterResponse;
import com.example.auth.client.UserServiceInternalClient;
import com.example.auth.client.dto.InternalCreateUserRequest;
import com.example.auth.client.dto.InternalCreateUserResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;

/**
 * 注册流程 Saga：使用 Saga Pattern 管理用户注册的分布式事务
 * 
 * Saga 步骤：
 * 1. 创建用户（createUser）
 * 2. 发送邮箱验证邮件（sendEmailVerification）
 * 
 * 补偿操作：
 * - 如果步骤 2 失败，删除已创建的用户
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RegistrationSaga {
    
    private final UserServiceInternalClient userClient;
    private final SagaOrchestrator sagaOrchestrator;
    
    /**
     * 执行注册 Saga
     */
    public RegisterResponse execute(RegisterRequest request) {
        SagaContext context = new SagaContext();
        context.put("email", request.getEmail().trim().toLowerCase());
        context.put("name", request.getEmail().split("@")[0]);
        
        // 准备创建用户请求
        InternalCreateUserRequest createUserRequest = new InternalCreateUserRequest();
        createUserRequest.setName(context.get("name", String.class));
        createUserRequest.setEmail(context.get("email", String.class));
        createUserRequest.setPassword(request.getPassword());
        
        // 定义 Saga 步骤
        List<SagaStep> steps = new ArrayList<>();
        
        // Step 1: 创建用户
        steps.add(new SagaStep(
            "createUser",
            1,
            () -> {
                log.info("Saga Step 1: 创建用户 - email={}", createUserRequest.getEmail());
                InternalCreateUserResponse response = userClient.createUser(createUserRequest);
                context.put("userId", response.getUserId());
                log.info("Saga Step 1: 用户创建成功 - userId={}", response.getUserId());
                return response;
            },
            () -> {
                Long userId = context.get("userId", Long.class);
                if (userId != null) {
                    log.info("Saga 补偿: 删除用户 - userId={}", userId);
                    try {
                        userClient.deleteUser(userId);
                        log.info("Saga 补偿成功: 用户已删除 - userId={}", userId);
                    } catch (Exception e) {
                        log.error("Saga 补偿失败: 删除用户失败 - userId={}, error={}", 
                            userId, e.getMessage(), e);
                        // 补偿失败时记录告警，需要人工介入
                        // TODO: 发送告警通知或记录到死信队列
                        throw new RuntimeException("补偿操作失败: 删除用户失败", e);
                    }
                }
            }
        ));
        
        // Step 2: 发送邮箱验证邮件
        steps.add(new SagaStep(
            "sendEmailVerification",
            2,
            () -> {
                Long userId = context.get("userId", Long.class);
                String email = context.get("email", String.class);
                
                if (userId == null) {
                    throw new BusinessException(ResultCode.REMOTE_SERVICE_ERROR, 
                        "用户 ID 不存在，无法发送验证邮件");
                }
                
                log.info("Saga Step 2: 发送邮箱验证邮件 - userId={}, email={}", userId, email);
                userClient.sendEmailVerification(userId, email);
                log.info("Saga Step 2: 邮箱验证邮件发送成功 - userId={}", userId);
                return null;
            },
            () -> {
                // 发送邮件失败不需要补偿（邮件发送是幂等的，可以重试）
                // 但用户已创建，需要删除用户（由 Step 1 的补偿处理）
                log.debug("Saga Step 2 补偿: 邮件发送失败，用户删除由 Step 1 补偿处理");
            }
        ));
        
        try {
            // 执行 Saga
            sagaOrchestrator.execute(steps, context);
            
            // Saga 执行成功
            return RegisterResponse.builder()
                .message("注册成功，请查收验证邮件")
                .email(context.get("email", String.class))
                .build();
                
        } catch (HttpClientErrorException e) {
            // 处理 HTTP 客户端错误
            if (e.getStatusCode() == HttpStatus.CONFLICT) {
                throw new BusinessException(ResultCode.EMAIL_ALREADY_EXISTS);
            }
            throw new BusinessException(ResultCode.REMOTE_SERVICE_ERROR, e.getMessage());
            
        } catch (RestClientException e) {
            // 处理远程服务异常
            throw new BusinessException(ResultCode.REMOTE_SERVICE_ERROR, e.getMessage());
            
        } catch (BusinessException e) {
            // 业务异常直接抛出
            throw e;
            
        } catch (Exception e) {
            // 其他异常
            log.error("注册 Saga 执行失败: error={}", e.getMessage(), e);
            throw new BusinessException(ResultCode.REMOTE_SERVICE_ERROR, 
                "注册失败，请稍后重试");
        }
    }
}
