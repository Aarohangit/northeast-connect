package in.floodresponse.rescue.service;

/** A request that makes sense but isn't allowed right now, e.g. dispatching a team that is already out. */
public class RuleViolationException extends RuntimeException {
    public RuleViolationException(String message) {
        super(message);
    }
}
