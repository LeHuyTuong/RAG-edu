package com.example.historyrag.exception;

import org.springframework.http.HttpStatus;

public class QuotaExceededException extends AppException {

    public QuotaExceededException(String message) {
        super(message, HttpStatus.PAYMENT_REQUIRED);
    }
}
