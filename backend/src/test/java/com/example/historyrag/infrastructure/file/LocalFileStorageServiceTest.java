package com.example.historyrag.infrastructure.file;

import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.feature.setting.SettingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.mockito.Mockito.mock;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class LocalFileStorageServiceTest {

    @TempDir
    private Path storageRoot;

    @TempDir
    private Path internalRoot;

    private final SettingService settingService = mock(SettingService.class);

    @Test
    void resolveInternalPath_returnsPathInsideInternalRoot() {
        LocalFileStorageService service = new LocalFileStorageService(
                storageRoot.toString(),
                internalRoot.toString(),
                settingService
        );

        String resolved = service.resolveInternalPath("lesson.pdf");

        assertEquals(internalRoot.resolve("lesson.pdf").toAbsolutePath().normalize().toString(), resolved);
    }

    @Test
    void resolveInternalPath_rejectsTraversalOutsideInternalRoot() {
        LocalFileStorageService service = new LocalFileStorageService(
                storageRoot.toString(),
                internalRoot.toString(),
                settingService
        );

        assertThrows(InvalidRequestException.class, () -> service.resolveInternalPath("../secret.pdf"));
    }
}
