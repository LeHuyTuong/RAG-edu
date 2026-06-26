package com.example.historyrag.shared;

import com.example.historyrag.exception.InvalidRequestException;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Utility methods for working with JWT tokens.
 *
 * <p>Spring Security decodes numeric JWT claims as {@link Integer}, not {@link Long}.
 * Direct assignment ({@code Long id = jwt.getClaim("userId")}) throws a
 * {@link ClassCastException} at runtime. Always use {@link #getUserId(Jwt)} instead.</p>
 */
public final class JwtUtils {

    private JwtUtils() {
    }

    /**
     * Safely extracts the {@code userId} claim from a JWT as a {@link Long}.
     *
     * <p>Handles the fact that Spring Security's JWT decoder returns numeric claims as
     * {@link Integer} rather than {@link Long}.</p>
     *
     * @param jwt the authenticated JWT
     * @return the userId as a Long
     * @throws InvalidRequestException if the claim is missing or not a number
     */
    public static Long getUserId(Jwt jwt) {
        Object rawUserId = jwt.getClaim("userId");
        if (rawUserId instanceof Number number) {
            return number.longValue();
        }
        throw new InvalidRequestException("Token không chứa userId hợp lệ");
    }
}
