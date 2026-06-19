package com.example.historyrag.feature.config;

import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.config.dto.ConfigResponse;
import com.example.historyrag.feature.config.dto.ConfigUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class ConfigServiceImpl implements ConfigService {

    private static final String KEY_ALLOWED_TYPES = "upload.allowed_types";
    private static final String KEY_MAX_SIZE = "upload.max_size_mb";

    private final SystemSettingRepository systemSettingRepository;

    public ConfigServiceImpl(SystemSettingRepository systemSettingRepository) {
        this.systemSettingRepository = systemSettingRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public ConfigResponse getConfig() {
        Map<String, String> settings = new HashMap<>();
        systemSettingRepository.findBySettingKey(KEY_ALLOWED_TYPES)
                .ifPresent(s -> settings.put(KEY_ALLOWED_TYPES, s.getSettingValue()));
        systemSettingRepository.findBySettingKey(KEY_MAX_SIZE)
                .ifPresent(s -> settings.put(KEY_MAX_SIZE, s.getSettingValue()));
        return ConfigResponse.fromMap(settings);
    }

    @Override
    @Transactional
    public ConfigResponse updateConfig(ConfigUpdateRequest request) {
        if (request.allowedTypes() != null) {
            upsertSetting(KEY_ALLOWED_TYPES, request.allowedTypes());
        }
        if (request.maxSizeMb() != null) {
            upsertSetting(KEY_MAX_SIZE, request.maxSizeMb());
        }
        return getConfig();
    }

    private void upsertSetting(String key, String value) {
        SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                .orElseGet(() -> {
                    SystemSetting s = new SystemSetting();
                    s.setSettingKey(key);
                    return s;
                });
        setting.setSettingValue(value);
        systemSettingRepository.save(setting);
    }
}
