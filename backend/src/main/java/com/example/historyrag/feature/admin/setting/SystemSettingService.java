package com.example.historyrag.feature.admin.setting;

import java.util.List;
import java.util.Optional;

public interface SystemSettingService {
    List<SystemSetting> getAllSettings();
    Optional<SystemSetting> getSetting(String key);
    String getSettingValue(String key, String defaultValue);
    SystemSetting updateSetting(String key, String value);
}
