package com.example.historyrag.feature.config;

import com.example.historyrag.feature.config.dto.ConfigResponse;
import com.example.historyrag.feature.config.dto.ConfigUpdateRequest;

public interface ConfigService {

    ConfigResponse getConfig();

    ConfigResponse updateConfig(ConfigUpdateRequest request);
}
