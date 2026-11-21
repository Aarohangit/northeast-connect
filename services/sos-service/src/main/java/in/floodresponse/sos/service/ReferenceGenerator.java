package in.floodresponse.sos.service;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Builds short references like AS-7K3Q9. The alphabet skips 0/O and 1/I/L
 * because people will be reading these out over a bad phone line.
 */
@Component
class ReferenceGenerator {

    private static final char[] ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ".toCharArray();
    private final SecureRandom random = new SecureRandom();

    String next() {
        StringBuilder sb = new StringBuilder("AS-");
        for (int i = 0; i < 5; i++) {
            sb.append(ALPHABET[random.nextInt(ALPHABET.length)]);
        }
        return sb.toString();
    }
}
