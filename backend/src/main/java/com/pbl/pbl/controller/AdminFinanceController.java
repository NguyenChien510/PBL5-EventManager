package com.pbl.pbl.controller;

import com.pbl.pbl.dto.FinanceConfigDTO;
import com.pbl.pbl.entity.SystemConfig;
import com.pbl.pbl.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/finance/config")
@RequiredArgsConstructor
public class AdminFinanceController {

    private final SystemConfigRepository systemConfigRepository;

    @GetMapping
    public ResponseEntity<FinanceConfigDTO> getConfig() {
        return ResponseEntity.ok(FinanceConfigDTO.builder()
                .defaultCommissionRate(getConfigValue("DEFAULT_COMMISSION_RATE", "10"))
                .fixedFeePerTicket(getConfigValue("FIXED_FEE_PER_TICKET", "5000"))
                .minWithdrawalAmount(getConfigValue("MIN_WITHDRAWAL_AMOUNT", "500000"))
                .withdrawalProcessTime(getConfigValue("WITHDRAWAL_PROCESS_TIME", "1-3 ngày làm việc"))
                .build());
    }

    @PostMapping
    public ResponseEntity<Void> updateConfig(@RequestBody FinanceConfigDTO configDTO) {
        saveConfig("DEFAULT_COMMISSION_RATE", configDTO.getDefaultCommissionRate(), "Tỷ lệ hoa hồng mặc định (%)");
        saveConfig("FIXED_FEE_PER_TICKET", configDTO.getFixedFeePerTicket(), "Phí cố định trên mỗi vé (VNĐ)");
        saveConfig("MIN_WITHDRAWAL_AMOUNT", configDTO.getMinWithdrawalAmount(), "Ngưỡng rút tiền tối thiểu (VNĐ)");
        saveConfig("WITHDRAWAL_PROCESS_TIME", configDTO.getWithdrawalProcessTime(), "Thời gian xử lý rút tiền");
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
