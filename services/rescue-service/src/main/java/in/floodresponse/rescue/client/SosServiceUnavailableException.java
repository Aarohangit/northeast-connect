package in.floodresponse.rescue.client;

public class SosServiceUnavailableException extends RuntimeException {
    public SosServiceUnavailableException() {
        super("SOS service is not reachable. Nothing was changed; try again.");
    }
}
