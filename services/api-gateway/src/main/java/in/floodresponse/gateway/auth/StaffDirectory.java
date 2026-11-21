package in.floodresponse.gateway.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Control-room accounts. Kept in config for now; the passwords are hashed
 * once at startup so nothing compares plain text at login time.
 */
@Component
public class StaffDirectory {

    private record Account(GatewayProperties.Staff staff, String passwordHash) {
    }

    private final Map<String, Account> accounts;
    private final PasswordEncoder encoder;
    private final String dummyHash;

    public StaffDirectory(GatewayProperties props, PasswordEncoder encoder) {
        this.encoder = encoder;
        String hash = encoder.encode(props.staffPassword());
        this.accounts = props.staff().stream()
                .collect(Collectors.toUnmodifiableMap(s -> s.username().toLowerCase(),
                        s -> new Account(s, hash), (a, b) -> a));
        this.dummyHash = hash;
    }

    public Optional<GatewayProperties.Staff> authenticate(String username, String password) {
        Account account = accounts.get(username.trim().toLowerCase());
        // Always run a hash check so response time doesn't reveal which usernames exist.
        boolean ok = encoder.matches(password, account == null ? dummyHash : account.passwordHash());
        return (account != null && ok) ? Optional.of(account.staff()) : Optional.empty();
    }

    public Optional<GatewayProperties.Staff> find(String username) {
        return Optional.ofNullable(accounts.get(username.toLowerCase())).map(Account::staff);
    }

}
