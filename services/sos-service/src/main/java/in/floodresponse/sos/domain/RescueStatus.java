package in.floodresponse.sos.domain;

/**
 * Where the request is in the rescue workflow. This is deliberately separate
 * from delivery: a request can be safely received and still be waiting for
 * a human to look at it.
 */
public enum RescueStatus {
    RECEIVED,
    VERIFIED,
    TEAM_ASSIGNED,
    IN_PROGRESS,
    RESCUED,
    REJECTED,
    DUPLICATE;

    public boolean isClosed() {
        return this == RESCUED || this == REJECTED || this == DUPLICATE;
    }
}
