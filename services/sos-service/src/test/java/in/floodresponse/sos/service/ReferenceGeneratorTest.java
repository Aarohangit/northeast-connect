package in.floodresponse.sos.service;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ReferenceGeneratorTest {

    private final ReferenceGenerator generator = new ReferenceGenerator();

    @Test
    void referencesAreShortAndAvoidCharactersThatAreEasyToMishearOnAPhoneLine() {
        for (int i = 0; i < 1000; i++) {
            String ref = generator.next();
            assertThat(ref).hasSize(8).startsWith("AS-");
            assertThat(ref.substring(3)).doesNotContainAnyWhitespaces().matches("[^01OIL]+");
        }
    }

    @Test
    void referencesAreEffectivelyUnique() {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 5000; i++) seen.add(generator.next());
        assertThat(seen.size()).isGreaterThan(4990);
    }
}
