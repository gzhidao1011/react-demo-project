package com.example.auth.saga;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Saga 编排器：管理 Saga 的执行和补偿
 * 实现编排式（Orchestration）Saga Pattern
 */
@Slf4j
@Component
public class SagaOrchestrator {
    
    /**
     * 执行 Saga
     * 
     * @param steps Saga 步骤列表
     * @param context Saga 上下文
     * @return 执行结果
     * @throws Exception 如果任何步骤失败，会执行补偿并抛出异常
     */
    public Object execute(List<SagaStep> steps, SagaContext context) throws Exception {
        if (context.getSagaId() == null) {
            context.setSagaId(UUID.randomUUID().toString());
        }
        
        log.info("开始执行 Saga: sagaId={}, steps={}", context.getSagaId(), steps.size());
        
        // 按顺序排序步骤
        List<SagaStep> sortedSteps = new ArrayList<>(steps);
        sortedSteps.sort(Comparator.comparingInt(SagaStep::getOrder));
        
        List<SagaStep> executedSteps = new ArrayList<>();
        
        try {
            // 顺序执行每个步骤
            for (SagaStep step : sortedSteps) {
                log.debug("执行 Saga 步骤: sagaId={}, step={}, order={}", 
                    context.getSagaId(), step.getName(), step.getOrder());
                
                try {
                    Object result = step.execute();
                    context.markStepCompleted(step.getName());
                    executedSteps.add(step);
                    
                    log.debug("Saga 步骤执行成功: sagaId={}, step={}", 
                        context.getSagaId(), step.getName());
                    
                } catch (Exception e) {
                    log.error("Saga 步骤执行失败: sagaId={}, step={}, error={}", 
                        context.getSagaId(), step.getName(), e.getMessage(), e);
                    throw e;
                }
            }
            
            log.info("Saga 执行成功: sagaId={}", context.getSagaId());
            return executedSteps.isEmpty() ? null : 
                executedSteps.get(executedSteps.size() - 1).execute();
            
        } catch (Exception e) {
            // 执行补偿操作（逆序补偿）
            log.warn("Saga 执行失败，开始补偿: sagaId={}, error={}", 
                context.getSagaId(), e.getMessage());
            
            compensate(executedSteps, context);
            
            throw e;
        }
    }
    
    /**
     * 执行补偿操作（逆序补偿已完成的步骤）
     */
    private void compensate(List<SagaStep> executedSteps, SagaContext context) {
        // 逆序补偿
        for (int i = executedSteps.size() - 1; i >= 0; i--) {
            SagaStep step = executedSteps.get(i);
            try {
                log.info("执行 Saga 补偿: sagaId={}, step={}", 
                    context.getSagaId(), step.getName());
                
                step.compensate();
                
                log.info("Saga 补偿成功: sagaId={}, step={}", 
                    context.getSagaId(), step.getName());
                
            } catch (Exception compensationException) {
                // 补偿失败记录日志，但不中断补偿流程
                log.error("Saga 补偿失败: sagaId={}, step={}, error={}", 
                    context.getSagaId(), step.getName(), 
                    compensationException.getMessage(), compensationException);
                
                // 补偿失败时，可以考虑：
                // 1. 发送告警通知
                // 2. 记录到死信队列
                // 3. 人工介入处理
            }
        }
    }
}
