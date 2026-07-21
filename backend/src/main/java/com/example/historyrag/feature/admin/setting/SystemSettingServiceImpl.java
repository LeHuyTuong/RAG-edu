package com.example.historyrag.feature.admin.setting;

import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SystemSettingServiceImpl implements SystemSettingService {

    private final SystemSettingRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<SystemSetting> getAllSettings() {
        return repository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SystemSetting> getSetting(String key) {
        return repository.findBySettingKey(key);
    }

    @Override
    @Transactional(readOnly = true)
    public String getSettingValue(String key, String defaultValue) {
        return repository.findBySettingKey(key)
                .map(SystemSetting::getSettingValue)
                .orElse(defaultValue);
    }

    @Override
    @Transactional
    public SystemSetting updateSetting(String key, String value) {
        SystemSetting setting = repository.findBySettingKey(key)
                .orElseGet(() -> {
                    SystemSetting newSetting = new SystemSetting();
                    newSetting.setSettingKey(key);
                    return newSetting;
                });
        setting.setSettingValue(value);
        return repository.save(setting);
    }
}
