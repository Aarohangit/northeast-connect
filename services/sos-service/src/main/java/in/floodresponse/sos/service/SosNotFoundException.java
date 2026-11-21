package in.floodresponse.sos.service;

public class SosNotFoundException extends RuntimeException {
    public SosNotFoundException(String reference) {
        super("No SOS request with reference " + reference);
    }
}
