package com.example.historyrag.infrastructure.file;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.util.Matrix;
import org.springframework.stereotype.Service;

@Service
public class PdfWatermarkService {

    private static final String WATERMARK_KEY = "RAG_EDU_WATERMARK";
    private static final String WATERMARK_VALUE = "PUBLIC_DOWNLOAD_PROTECTED";
    private static final String WATERMARK_TEXT = "RAG-EDU PUBLIC COPY - DO NOT REUPLOAD";

    public boolean hasPublicDownloadWatermark(byte[] bytes) {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDDocumentInformation info = document.getDocumentInformation();
            return WATERMARK_VALUE.equals(info.getCustomMetadataValue(WATERMARK_KEY));
        } catch (IOException ignored) {
            return false;
        }
    }

    private static final DateTimeFormatter DTF = DateTimeFormatter
            .ofPattern("yyyy-MM-dd HH:mm 'UTC'")
            .withZone(ZoneId.of("UTC"));

    public byte[] addPublicDownloadWatermark(byte[] source, String downloaderEmail,
                                              String ownerName, String originalAuthor, Instant downloadedAt) {
        try (PDDocument document = Loader.loadPDF(source)) {
            PDFont font = loadUnicodeFont(document);

            String footerLine1 = "Downloaded from RAG-edu by "
                    + (downloaderEmail == null || downloaderEmail.isBlank() ? "unknown" : downloaderEmail)
                    + " at " + DTF.format(downloadedAt);
            String footerLine2 = "Owner: "
                    + (ownerName == null || ownerName.isBlank() ? "unknown" : ownerName)
                    + (originalAuthor == null || originalAuthor.isBlank() ? "" : " | Original author: " + originalAuthor);

            for (PDPage page : document.getPages()) {
                float width = page.getMediaBox().getWidth();
                float height = page.getMediaBox().getHeight();

                try (PDPageContentStream stream = new PDPageContentStream(
                        document,
                        page,
                        PDPageContentStream.AppendMode.APPEND,
                        true,
                        true)) {
                    stream.beginText();
                    stream.setFont(font, 26);
                    stream.setNonStrokingColor(new Color(190, 190, 190));
                    stream.setTextMatrix(Matrix.getRotateInstance(
                            Math.toRadians(35),
                            width * 0.14f,
                            height * 0.35f));
                    stream.showText(WATERMARK_TEXT);
                    stream.endText();

                    stream.beginText();
                    stream.setFont(font, 10);
                    stream.setNonStrokingColor(new Color(140, 140, 140));
                    stream.newLineAtOffset(36, 28);
                    stream.showText(footerLine1);
                    stream.endText();

                    stream.beginText();
                    stream.setFont(font, 10);
                    stream.setNonStrokingColor(new Color(140, 140, 140));
                    stream.newLineAtOffset(36, 16);
                    stream.showText(footerLine2);
                    stream.endText();
                }
            }

            PDDocumentInformation info = document.getDocumentInformation();
            info.setCustomMetadataValue(WATERMARK_KEY, WATERMARK_VALUE);
            info.setKeywords(appendKeyword(info.getKeywords(), WATERMARK_KEY));
            document.setDocumentInformation(info);

            ByteArrayOutputStream output = new ByteArrayOutputStream();
            document.save(output);
            return output.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Không thể tạo watermark cho PDF", e);
        }
    }

    /**
     * Standard14Fonts (Helvetica) chỉ hỗ trợ WinAnsiEncoding, không vẽ được ký tự
     * tiếng Việt có dấu (VD: "Trần Trọng Kim") và ném IllegalArgumentException khi
     * showText(). Nhúng font TrueType Unicode để watermark luôn render được.
     */
    private PDFont loadUnicodeFont(PDDocument document) throws IOException {
        try (InputStream fontStream = getClass().getResourceAsStream("/fonts/NotoSans-Regular.ttf")) {
            if (fontStream == null) {
                throw new IOException("Không tìm thấy font watermark /fonts/NotoSans-Regular.ttf trong classpath");
            }
            return PDType0Font.load(document, fontStream, true);
        }
    }

    private String appendKeyword(String keywords, String keyword) {
        if (keywords == null || keywords.isBlank()) {
            return keyword;
        }
        if (keywords.contains(keyword)) {
            return keywords;
        }
        return keywords + ", " + keyword;
    }
}
