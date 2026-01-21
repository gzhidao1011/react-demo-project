package com.example.order.repository;

import com.example.order.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 订单数据访问层
 */
@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    
    /**
     * 根据用户 ID 查找订单
     */
    List<OrderEntity> findByUserId(Long userId);
    
    /**
     * 根据状态查找订单
     */
    List<OrderEntity> findByStatus(String status);
    
    /**
     * 根据用户 ID 和状态查找订单
     */
    List<OrderEntity> findByUserIdAndStatus(Long userId, String status);
}
