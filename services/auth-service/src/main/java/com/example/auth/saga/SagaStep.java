package com.example.auth.saga;

import java.util.function.Supplier;

/**
 * Saga 步骤：定义执行逻辑和补偿逻辑
 */
public class SagaStep {
    /**
     * 步骤名称
     */
    private final String name;
    
    /**
     * 执行顺序
     */
    private final int order;
    
    /**
     * 执行逻辑
     */
    private final Supplier<Object> action;
    
    /**
     * 补偿逻辑
     */
    private final Runnable compensation;
    
    public SagaStep(String name, int order, Supplier<Object> action, Runnable compensation) {
        this.name = name;
        this.order = order;
        this.action = action;
        this.compensation = compensation;
    }
    
    /**
     * 执行步骤
     */
    public Object execute() {
        return action.get();
    }
    
    /**
     * 执行补偿操作
     */
    public void compensate() {
        if (compensation != null) {
            compensation.run();
        }
    }
    
    public String getName() {
        return name;
    }
    
    public int getOrder() {
        return order;
    }
}
