package in.floodresponse.sos.service;

import in.floodresponse.sos.domain.RescueStatus;

public class InvalidTransitionException extends RuntimeException {
    public InvalidTransitionException(RescueStatus from, RescueStatus to) {
        super("Cannot move a request from " + from + " to " + to);
    }
}
