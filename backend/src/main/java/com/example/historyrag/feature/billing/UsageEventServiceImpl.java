package com.example.historyrag.feature.billing;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsageEventServiceImpl implements UsageEventService {

    private final UsageEventRepository repository;

    @Override
    @Transactional
    public UsageEvent save(UsageEvent usageEvent) {
        return repository.save(usageEvent);
    }
}
