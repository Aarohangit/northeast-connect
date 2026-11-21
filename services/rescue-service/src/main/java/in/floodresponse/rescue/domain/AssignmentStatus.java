package in.floodresponse.rescue.domain;

public enum AssignmentStatus {
    ASSIGNED,
    EN_ROUTE,
    COMPLETED,
    CANCELLED;

    public boolean isOpen() {
        return this == ASSIGNED || this == EN_ROUTE;
    }
}
