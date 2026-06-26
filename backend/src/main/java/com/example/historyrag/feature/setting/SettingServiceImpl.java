package com.example.historyrag.feature.setting;

import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.setting.dto.SettingResponse;
import com.example.historyrag.feature.setting.dto.SettingUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingServiceImpl implements SettingService {

    private final AppSettingRepository appSettingRepository;

    public SettingServiceImpl(AppSettingRepository appSettingRepository) {
        this.appSettingRepository = appSettingRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public SettingResponse getConfig() {
        AppSetting config = getOrDefault();
        return new SettingResponse(config.getAllowedTypes(), String.valueOf(config.getMaxSizeMb()));
    }

    @Override
    @Transactional
    public SettingResponse updateConfig(SettingUpdateRequest request) {
        AppSetting config = getOrDefault();
        if (request.allowedTypes() != null) {
            config.setAllowedTypes(request.allowedTypes().trim().toLowerCase());
        }
        if (request.maxSizeMb() != null) {
            config.setMaxSizeMb(request.maxSizeMb());
        }
        appSettingRepository.save(config);
        return new SettingResponse(config.getAllowedTypes(), String.valueOf(config.getMaxSizeMb()));
    }

    AppSetting getOrDefault() {
        return appSettingRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    AppSetting c = new AppSetting();
                    c.setAllowedTypes("pdf,docx,txt,md");
                    c.setMaxSizeMb(20);
                    return appSettingRepository.save(c);
                });
    }
}
