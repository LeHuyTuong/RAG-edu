package com.example.historyrag.feature.setting;

import com.example.historyrag.feature.setting.dto.SettingResponse;
import com.example.historyrag.feature.setting.dto.SettingUpdateRequest;

public interface SettingService {

    SettingResponse getConfig();

    SettingResponse updateConfig(SettingUpdateRequest request);
}
