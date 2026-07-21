package com.example.historyrag.infrastructure.file;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PdfWatermarkServiceTest {

    private final PdfWatermarkService service = new PdfWatermarkService();

    @Test
    @DisplayName("addPublicDownloadWatermark — Vietnamese owner/original author should not throw")
    void addPublicDownloadWatermark_withVietnameseDiacritics_doesNotThrow() throws IOException {
        byte[] blankPdf = blankOnePagePdf();

        byte[] watermarked = assertDoesNotThrow(() -> service.addPublicDownloadWatermark(
                blankPdf,
                "reader@example.com",
                "Nguyễn Văn Ánh",
                "Trần Trọng Kim",
                Instant.now()));

        assertTrue(watermarked.length > 0);
        assertTrue(service.hasPublicDownloadWatermark(watermarked));
    }

    @Test
    @DisplayName("addPublicDownloadWatermark — blank original author omits the extra footer segment")
    void addPublicDownloadWatermark_blankOriginalAuthor_doesNotThrow() throws IOException {
        byte[] blankPdf = blankOnePagePdf();

        byte[] watermarked = assertDoesNotThrow(() -> service.addPublicDownloadWatermark(
                blankPdf,
                "reader@example.com",
                "Nguyễn Văn Ánh",
                "",
                Instant.now()));

        assertFalse(watermarked.length == 0);
    }

    private byte[] blankOnePagePdf() throws IOException {
        try (PDDocument document = new PDDocument()) {
            document.addPage(new PDPage());
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }
}
