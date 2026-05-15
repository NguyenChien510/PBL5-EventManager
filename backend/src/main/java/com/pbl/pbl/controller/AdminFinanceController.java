package com.pbl.pbl.controller;

import com.pbl.pbl.dto.AdminFinanceOverviewDTO;
import com.pbl.pbl.dto.FinanceConfigDTO;
import com.pbl.pbl.entity.SystemConfig;
import com.pbl.pbl.repository.OrderRepository;
import com.pbl.pbl.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/finance")
@RequiredArgsConstructor
public class AdminFinanceController {

    private final SystemConfigRepository systemConfigRepository;
    private final OrderRepository orderRepository;

    @GetMapping("/overview")
    public ResponseEntity<AdminFinanceOverviewDTO> getOverview() {
        var orders = orderRepository.findAll();
        
        java.math.BigDecimal totalRevenue = orders.stream()
                .filter(o -> com.pbl.pbl.entity.OrderStatus.COMPLETED.equals(o.getStatus()))
                .map(com.pbl.pbl.entity.Order::getTotalAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                
        java.math.BigDecimal totalPlatformFee = orders.stream()
                .filter(o -> com.pbl.pbl.entity.OrderStatus.COMPLETED.equals(o.getStatus()))
                .map(o -> o.getPlatformFee() != null ? o.getPlatformFee() : java.math.BigDecimal.ZERO)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        return ResponseEntity.ok(AdminFinanceOverviewDTO.builder()
                .totalRevenue(totalRevenue)
                .totalPlatformFee(totalPlatformFee)
                .totalOrders((long) orders.size())
                .build());
    }

    @GetMapping("/config")
    public ResponseEntity<FinanceConfigDTO> getConfig() {
        return ResponseEntity.ok(FinanceConfigDTO.builder()
                .defaultCommissionRate(getConfigValue("DEFAULT_COMMISSION_RATE", "10"))
                .autoApply(Boolean.parseBoolean(getConfigValue("AUTO_APPLY_COMMISSION", "true")))
                .build());
    }

    @PostMapping("/config")
    public ResponseEntity<Void> updateConfig(@RequestBody FinanceConfigDTO configDTO) {
        saveConfig("DEFAULT_COMMISSION_RATE", configDTO.getDefaultCommissionRate(), "Tỷ lệ thuế/phí nền tảng mặc định (%)");
        if (configDTO.getAutoApply() != null) {
            saveConfig("AUTO_APPLY_COMMISSION", String.valueOf(configDTO.getAutoApply()), "Tự động áp dụng phí hệ thống cho đơn hàng");
        }
        return ResponseEntity.ok().build();
    }

    private String getConfigValue(String key, String defaultValue) {
        return systemConfigRepository.findById(key)
                .map(SystemConfig::getConfigValue)
                .orElse(defaultValue);
    }

    private void saveConfig(String key, String value, String description) {
        if (value != null) {
            SystemConfig config = systemConfigRepository.findById(key)
                    .orElse(SystemConfig.builder().configKey(key).build());
            config.setConfigValue(value);
            config.setDescription(description);
            systemConfigRepository.save(config);
        }
    }
}
