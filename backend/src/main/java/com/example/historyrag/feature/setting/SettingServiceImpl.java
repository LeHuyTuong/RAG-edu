package com.example.historyrag.feature.setting;

import com.example.historyrag.feature.setting.dto.SettingResponse;
import com.example.historyrag.feature.setting.dto.SettingUpdateRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingServiceImpl implements SettingService {

    private final AppSettingRepository appSettingRepository;
    private final String defaultAutoApproveCron;

    public SettingServiceImpl(AppSettingRepository appSettingRepository,
                              @Value("${app.auto-approve.cron:0 * * * * *}") String defaultAutoApproveCron) {
        this.appSettingRepository = appSettingRepository;
        this.defaultAutoApproveCron = defaultAutoApproveCron;
    }

    @Override
    @Transactional(readOnly = true)
    public SettingResponse getConfig() {
        AppSetting config = getOrDefault();
        return new SettingResponse(
                config.getAllowedTypes(),
                String.valueOf(config.getMaxSizeMb()),
                defaultAutoApproveCron
        );
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
        // autoApproveCron chỉ lưu trong application.yml, không lưu DB
        appSettingRepository.save(config);
        return new SettingResponse(
                config.getAllowedTypes(),
                String.valueOf(config.getMaxSizeMb()),
                defaultAutoApproveCron
        );
    }

    AppSetting getOrDefault() {
        return appSettingRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    AppSetting c = new AppSetting();
                    c.setAllowedTypes(SettingDefaults.ALLOWED_UPLOAD_TYPES);
                    c.setMaxSizeMb(SettingDefaults.MAX_UPLOAD_SIZE_MB);
                    return appSettingRepository.save(c);
                });
    }
}
