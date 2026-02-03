package com.example.auth.saga;

import lombok.Data;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;

/**
 * Saga 上下文：存储 Saga 执行过程中的状态和数据
 * 用于追踪已完成的步骤和需要补偿的操作
 */
@Data
public class SagaContext {
    /**
     * Saga ID（用于追踪和日志）
     */
    private String sagaId;
    
    /**
     * 已完成的步骤集合
     */
    private Set<String> completedSteps = new HashSet<>();
    
    /**
     * Saga 执行过程中的数据存储
     */
    private Map<String, Object> data = new HashMap<>();
    
    /**
     * 标记步骤为已完成
     */
    public void markStepCompleted(String stepName) {
        completedSteps.add(stepName);
    }
    
    /**
     * 检查步骤是否已完成
     */
    public boolean isStepCompleted(String stepName) {
        return completedSteps.contains(stepName);
    }
    
    /**
     * 存储数据
     */
    public void put(String key, Object value) {
        data.put(key, value);
    }
    
    /**
     * 获取数据
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> type) {
        return (T) data.get(key);
    }
    
    /**
     * 获取数据（带默认值）
     */
    @SuppressWarnings("unchecked")
    public <T> T getOrDefault(String key, T defaultValue, Class<T> type) {
        Object value = data.get(key);
        return value != null ? (T) value : defaultValue;
    }
}
